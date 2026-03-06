import DatabaseConstructor from 'better-sqlite3';
import { createAuditLog } from '@/lib/db/audit-log';
import type { TransferScope, TransferPreview, BulkTransferResult } from '@/types';

let db: import('better-sqlite3').Database | null = null;

function getDb() {
  if (!db) {
    const dbPath = process.env.DATABASE_PATH || './data/crm.db';
    db = new DatabaseConstructor(dbPath);
  }
  return db;
}

export function getTransferPreview(
  sourceUserId: string,
  targetUserId: string,
  scope: TransferScope
): TransferPreview {
  const database = getDb();

  // Get user names
  const sourceUser = database
    .prepare('SELECT full_name FROM users WHERE id = ?')
    .get(sourceUserId) as { full_name: string } | undefined;

  const targetUser = database
    .prepare('SELECT full_name FROM users WHERE id = ?')
    .get(targetUserId) as { full_name: string } | undefined;

  let customersQuery = 'SELECT COUNT(*) as count FROM customers WHERE assigned_user_id = ?';
  let quotationsQuery = `
    SELECT COUNT(*) as count FROM quotations 
    WHERE assigned_user_id = ?
  `;

  if (scope === 'active') {
    customersQuery += " AND status = 'Aktif'";
    quotationsQuery += " AND status = 'Bekliyor'";
  } else if (scope === 'open_quotes') {
    customersQuery = 'SELECT 0 as count'; // No customers for this scope
    quotationsQuery += " AND status = 'Bekliyor'";
  }

  const customersCount = database
    .prepare(customersQuery)
    .get(sourceUserId) as { count: number };

  const quotationsCount = database
    .prepare(quotationsQuery)
    .get(sourceUserId) as { count: number };

  return {
    source_user_name: sourceUser?.full_name || 'Unknown',
    target_user_name: targetUser?.full_name || 'Unknown',
    customers_count: customersCount.count,
    quotations_count: quotationsCount.count,
  };
}

export function transferCustomers(
  sourceUserId: string,
  targetUserId: string,
  scope: TransferScope,
  reason: string,
  performedBy: string,
  deactivateSource: boolean
): BulkTransferResult {
  const database = getDb();

  try {
    // Start transaction
    database.exec('BEGIN TRANSACTION');

    let customersUpdated = 0;
    let quotationsUpdated = 0;

    // Transfer customers based on scope
    if (scope === 'all' || scope === 'active') {
      let customerQuery = 'UPDATE customers SET assigned_user_id = ?, updated_at = ? WHERE assigned_user_id = ?';
      const params: (string | number)[] = [targetUserId, new Date().toISOString(), sourceUserId];

      if (scope === 'active') {
        customerQuery += " AND status = 'Aktif'";
      }

      const customerResult = database.prepare(customerQuery).run(...params);
      customersUpdated = customerResult.changes;

      // Log each customer transfer
      if (customersUpdated > 0) {
        const customers = database
          .prepare('SELECT id FROM customers WHERE assigned_user_id = ?')
          .all(targetUserId) as { id: string }[];

        for (const customer of customers.slice(0, customersUpdated)) {
          createAuditLog({
            user_id: performedBy,
            record_type: 'customer',
            record_id: customer.id,
            action: 'assignment_changed',
            changes: {
              assigned_user_id: {
                old: sourceUserId,
                new: targetUserId,
              },
            },
            metadata: {
              reason,
              transfer_type: 'bulk',
            },
          });
        }
      }
    }

    // Transfer quotations
    if (scope === 'all' || scope === 'open_quotes' || scope === 'active') {
      let quotationQuery = 'UPDATE quotations SET assigned_user_id = ?, updated_at = ? WHERE assigned_user_id = ?';
      const params: (string | number)[] = [targetUserId, new Date().toISOString(), sourceUserId];

      if (scope === 'open_quotes' || scope === 'active') {
        quotationQuery += " AND status = 'Bekliyor'";
      }

      const quotationResult = database.prepare(quotationQuery).run(...params);
      quotationsUpdated = quotationResult.changes;

      // Log quotation transfers
      if (quotationsUpdated > 0) {
        createAuditLog({
          user_id: performedBy,
          record_type: 'bulk_transfer',
          record_id: crypto.randomUUID(),
          action: 'quotations_transferred',
          changes: {
            count: { old: 0, new: quotationsUpdated },
            source_user_id: { old: sourceUserId, new: targetUserId },
          },
          metadata: {
            reason,
            transfer_type: 'bulk',
            scope,
          },
        });
      }
    }

    // Deactivate source user if requested
    let deactivatedUser = false;
    if (deactivateSource) {
      database
        .prepare('UPDATE users SET is_active = 0, updated_at = ? WHERE id = ?')
        .run(new Date().toISOString(), sourceUserId);
      deactivatedUser = true;

      createAuditLog({
        user_id: performedBy,
        record_type: 'user',
        record_id: sourceUserId,
        action: 'user_deactivated',
        changes: {
          is_active: { old: true, new: false },
        },
        metadata: {
          reason: `Deactivated after transfer to ${targetUserId}`,
        },
      });
    }

    // Commit transaction
    database.exec('COMMIT');

    return {
      success: true,
      transferred_customers: customersUpdated,
      transferred_quotations: quotationsUpdated,
      deactivated_user: deactivatedUser,
    };
  } catch (error) {
    // Rollback on error
    database.exec('ROLLBACK');
    console.error('Transfer error:', error);

    return {
      success: false,
      transferred_customers: 0,
      transferred_quotations: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

export function transferSingleCustomer(
  customerId: string,
  fromUserId: string,
  toUserId: string,
  reason: string,
  performedBy: string,
  cascadeToOpenQuotes: boolean
): BulkTransferResult {
  const database = getDb();

  try {
    database.exec('BEGIN TRANSACTION');

    // Verify customer belongs to fromUserId
    const customer = database
      .prepare('SELECT assigned_user_id FROM customers WHERE id = ?')
      .get(customerId) as { assigned_user_id: string } | undefined;

    if (!customer) {
      database.exec('ROLLBACK');
      return {
        success: false,
        transferred_customers: 0,
        transferred_quotations: 0,
        errors: ['Customer not found'],
      };
    }

    // Update customer assignment
    database
      .prepare('UPDATE customers SET assigned_user_id = ?, updated_at = ? WHERE id = ?')
      .run(toUserId, new Date().toISOString(), customerId);

    // Log the assignment change
    createAuditLog({
      user_id: performedBy,
      record_type: 'customer',
      record_id: customerId,
      action: 'assignment_changed',
      changes: {
        assigned_user_id: {
          old: fromUserId,
          new: toUserId,
        },
      },
      metadata: {
        reason,
        transfer_type: 'single',
        cascade_to_quotes: cascadeToOpenQuotes,
      },
    });

    let quotationsUpdated = 0;

    // Cascade to open quotations if requested
    if (cascadeToOpenQuotes) {
      const quotationResult = database
        .prepare(`
          UPDATE quotations 
          SET assigned_user_id = ?, updated_at = ? 
          WHERE customer_id = ? AND assigned_user_id = ? AND status = 'Bekliyor'
        `)
        .run(toUserId, new Date().toISOString(), customerId, fromUserId);

      quotationsUpdated = quotationResult.changes;

      if (quotationsUpdated > 0) {
        createAuditLog({
          user_id: performedBy,
          record_type: 'quotation',
          record_id: customerId,
          action: 'quotations_transferred_with_customer',
          changes: {
            count: { old: 0, new: quotationsUpdated },
          },
          metadata: {
            reason,
            transfer_type: 'cascade',
          },
        });
      }
    }

    database.exec('COMMIT');

    return {
      success: true,
      transferred_customers: 1,
      transferred_quotations: quotationsUpdated,
    };
  } catch (error) {
    database.exec('ROLLBACK');
    console.error('Single transfer error:', error);

    return {
      success: false,
      transferred_customers: 0,
      transferred_quotations: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}
