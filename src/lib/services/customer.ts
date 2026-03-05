import pool from '@/db/connection';
import { logAudit, type AuditChanges } from '@/lib/audit';
import type { CustomerInput, CustomerUpdateInput, CustomerFilter, ConflictCheckInput } from '@/lib/validators/customer';

export interface Customer {
  id: number;
  company_name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  transport_modes: string[];
  service_types: string[];
  incoterms: string[];
  direction: string[];
  origin_countries: string[];
  destination_countries: string[];
  source: string | null;
  potential: 'Dusuk' | 'Orta' | 'Yuksek' | null;
  status: 'Aktif' | 'Pasif' | 'Soguk';
  assigned_user_id: number | null;
  assigned_user_name?: string | null;
  last_contact_date: Date | null;
  last_quote_date: Date | null;
  notes: string | null;
  created_by: number | null;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface ConflictResult {
  customer: Customer;
  confidence: number;
  matchedFields: string[];
}

function buildChanges(oldData: Record<string, unknown>, newData: Record<string, unknown>): AuditChanges {
  const changes: AuditChanges = {};
  for (const key of Object.keys(newData)) {
    if (oldData[key] !== newData[key]) {
      changes[key] = {
        old: oldData[key],
        new: newData[key],
      };
    }
  }
  return changes;
}

export async function findConflicts(input: ConflictCheckInput, excludeId?: number): Promise<ConflictResult[]> {
  const conflicts: ConflictResult[] = [];
  const seenIds = new Set<number>();

  if (input.company_name) {
    const companyQuery = `
      SELECT c.*, u.full_name as assigned_user_name,
        similarity(c.company_name, $1) as sim_score
      FROM customers c
      LEFT JOIN users u ON c.assigned_user_id = u.id
      WHERE c.deleted_at IS NULL
        AND c.company_name % $1
        AND similarity(c.company_name, $1) > 0.3
        ${excludeId ? 'AND c.id != $2' : ''}
      ORDER BY sim_score DESC
      LIMIT 10
    `;
    const companyParams = excludeId ? [input.company_name, excludeId] : [input.company_name];
    const companyResult = await pool.query(companyQuery, companyParams);

    for (const row of companyResult.rows) {
      if (!seenIds.has(row.id)) {
        seenIds.add(row.id);
        conflicts.push({
          customer: row as Customer,
          confidence: Math.round(parseFloat(row.sim_score) * 100),
          matchedFields: ['company_name'],
        });
      }
    }
  }

  if (input.phone) {
    const phoneQuery = `
      SELECT c.*, u.full_name as assigned_user_name
      FROM customers c
      LEFT JOIN users u ON c.assigned_user_id = u.id
      WHERE c.deleted_at IS NULL
        AND c.phone = $1
        ${excludeId ? 'AND c.id != $2' : ''}
      LIMIT 5
    `;
    const phoneParams = excludeId ? [input.phone, excludeId] : [input.phone];
    const phoneResult = await pool.query(phoneQuery, phoneParams);

    for (const row of phoneResult.rows) {
      if (!seenIds.has(row.id)) {
        seenIds.add(row.id);
        conflicts.push({
          customer: row as Customer,
          confidence: 100,
          matchedFields: ['phone'],
        });
      }
    }
  }

  if (input.email) {
    const emailQuery = `
      SELECT c.*, u.full_name as assigned_user_name
      FROM customers c
      LEFT JOIN users u ON c.assigned_user_id = u.id
      WHERE c.deleted_at IS NULL
        AND c.email = $1
        ${excludeId ? 'AND c.id != $2' : ''}
      LIMIT 5
    `;
    const emailParams = excludeId ? [input.email, excludeId] : [input.email];
    const emailResult = await pool.query(emailQuery, emailParams);

    for (const row of emailResult.rows) {
      if (!seenIds.has(row.id)) {
        seenIds.add(row.id);
        conflicts.push({
          customer: row as Customer,
          confidence: 100,
          matchedFields: ['email'],
        });
      } else {
        const existing = conflicts.find(c => c.customer.id === row.id);
        if (existing) {
          existing.matchedFields.push('email');
          existing.confidence = Math.max(existing.confidence, 100);
        }
      }
    }
  }

  return conflicts.sort((a, b) => b.confidence - a.confidence);
}

export async function getCustomers(filters: CustomerFilter): Promise<{ customers: Customer[]; total: number }> {
  const { search, status, potential, source, assigned_user_id, transport_mode, page, limit } = filters;

  const whereConditions: string[] = ['c.deleted_at IS NULL'];
  const params: (string | number)[] = [];
  let paramIndex = 1;

  if (search) {
    whereConditions.push(`(
      c.company_name ILIKE $${paramIndex}
      OR c.contact_name ILIKE $${paramIndex}
      OR c.phone ILIKE $${paramIndex}
      OR c.email ILIKE $${paramIndex}
      OR c.company_name % $${paramIndex}
    )`);
    params.push(`%${search}%`);
    paramIndex++;
  }

  if (status) {
    whereConditions.push(`c.status = $${paramIndex++}`);
    params.push(status);
  }

  if (potential) {
    whereConditions.push(`c.potential = $${paramIndex++}`);
    params.push(potential);
  }

  if (source) {
    whereConditions.push(`c.source = $${paramIndex++}`);
    params.push(source);
  }

  if (assigned_user_id) {
    whereConditions.push(`c.assigned_user_id = $${paramIndex++}`);
    params.push(assigned_user_id);
  }

  if (transport_mode) {
    whereConditions.push(`c.transport_modes @> $${paramIndex}::jsonb`);
    params.push(JSON.stringify([transport_mode]));
    paramIndex++;
  }

  const whereClause = whereConditions.join(' AND ');

  const countQuery = `SELECT COUNT(*) FROM customers c WHERE ${whereClause}`;
  const countResult = await pool.query(countQuery, params);
  const total = parseInt(countResult.rows[0].count, 10);

  const query = `
    SELECT c.*, u.full_name as assigned_user_name
    FROM customers c
    LEFT JOIN users u ON c.assigned_user_id = u.id
    WHERE ${whereClause}
    ORDER BY c.created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;
  params.push(limit, (page - 1) * limit);

  const result = await pool.query(query, params);
  return { customers: result.rows as Customer[], total };
}

export async function getCustomerById(id: number): Promise<Customer | null> {
  const query = `
    SELECT c.*, u.full_name as assigned_user_name
    FROM customers c
    LEFT JOIN users u ON c.assigned_user_id = u.id
    WHERE c.id = $1 AND c.deleted_at IS NULL
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0] as Customer || null;
}

export async function createCustomer(
  data: CustomerInput,
  createdBy: number | null
): Promise<Customer> {
  const query = `
    INSERT INTO customers (
      company_name, contact_name, phone, email, address,
      transport_modes, service_types, incoterms, direction,
      origin_countries, destination_countries, source, potential,
      status, assigned_user_id, notes, created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    RETURNING *
  `;

  const values = [
    data.company_name,
    data.contact_name,
    data.phone,
    data.email,
    data.address,
    JSON.stringify(data.transport_modes),
    JSON.stringify(data.service_types),
    JSON.stringify(data.incoterms),
    JSON.stringify(data.direction),
    JSON.stringify(data.origin_countries),
    JSON.stringify(data.destination_countries),
    data.source,
    data.potential,
    data.status,
    data.assigned_user_id,
    data.notes,
    createdBy,
  ];

  const result = await pool.query(query, values);
  const customer = result.rows[0] as Customer;

  await logAudit(createdBy, 'customer', customer.id, 'CREATE', {
    data: { old: null, new: data },
  });

  return customer;
}

export async function updateCustomer(
  id: number,
  data: CustomerUpdateInput,
  updatedBy: number | null
): Promise<Customer | null> {
  const existing = await getCustomerById(id);
  if (!existing) return null;

  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  const settableFields: (keyof CustomerInput)[] = [
    'company_name', 'contact_name', 'phone', 'email', 'address',
    'transport_modes', 'service_types', 'incoterms', 'direction',
    'origin_countries', 'destination_countries', 'source', 'potential',
    'status', 'assigned_user_id', 'notes',
  ];

  for (const field of settableFields) {
    if (data[field] !== undefined) {
      fields.push(`${field} = $${paramIndex++}`);
      const value = data[field];
      if (Array.isArray(value)) {
        values.push(JSON.stringify(value));
      } else {
        values.push(value);
      }
    }
  }

  if (fields.length === 0) {
    return existing;
  }

  fields.push(`updated_at = CURRENT_TIMESTAMP`);

  const query = `
    UPDATE customers
    SET ${fields.join(', ')}
    WHERE id = $${paramIndex} AND deleted_at IS NULL
    RETURNING *
  `;
  values.push(id);

  const result = await pool.query(query, values);
  const customer = result.rows[0] as Customer;

  const changes = buildChanges(existing as unknown as Record<string, unknown>, data as Record<string, unknown>);
  await logAudit(updatedBy, 'customer', id, 'UPDATE', changes);

  return customer;
}

export async function deleteCustomer(
  id: number,
  deletedBy: number | null
): Promise<Customer | null> {
  const existing = await getCustomerById(id);
  if (!existing) return null;

  const query = `
    UPDATE customers
    SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1 AND deleted_at IS NULL
    RETURNING *
  `;

  const result = await pool.query(query, [id]);
  const customer = result.rows[0] as Customer;

  await logAudit(deletedBy, 'customer', id, 'DELETE', {
    deleted_at: { old: null, new: new Date().toISOString() },
  });

  return customer;
}

export async function forceCreateCustomer(
  data: CustomerInput,
  createdBy: number | null
): Promise<Customer> {
  const customer = await createCustomer(data, createdBy);
  await logAudit(createdBy, 'customer', customer.id, 'FORCE_CREATE', {
    data: { old: null, new: data },
  }, true);
  return customer;
}

export async function updateLastContactDate(customerId: number): Promise<void> {
  await pool.query(
    `UPDATE customers SET last_contact_date = CURRENT_DATE WHERE id = $1`,
    [customerId]
  );
}

export async function updateLastQuoteDate(customerId: number): Promise<void> {
  await pool.query(
    `UPDATE customers SET last_quote_date = CURRENT_DATE WHERE id = $1`,
    [customerId]
  );
}
