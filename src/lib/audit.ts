import pool from '@/db/connection';

export interface AuditChanges {
  [key: string]: {
    old: unknown;
    new: unknown;
  };
}

export async function logAudit(
  userId: number | null,
  recordType: string,
  recordId: number,
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'FORCE_CREATE',
  changes?: AuditChanges,
  forced = false
): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO audit_log (user_id, record_type, record_id, action, changes, forced)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, recordType, recordId, action, changes ? JSON.stringify(changes) : null, forced]
    );
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}

export async function getAuditLogs(
  recordType?: string,
  recordId?: number,
  userId?: number,
  limit = 50,
  offset = 0
): Promise<unknown[]> {
  let query = `
    SELECT al.*, u.full_name as user_name
    FROM audit_log al
    LEFT JOIN users u ON al.user_id = u.id
    WHERE 1=1
  `;
  const params: (string | number)[] = [];
  let paramIndex = 1;

  if (recordType) {
    query += ` AND al.record_type = $${paramIndex++}`;
    params.push(recordType);
  }

  if (recordId) {
    query += ` AND al.record_id = $${paramIndex++}`;
    params.push(recordId);
  }

  if (userId) {
    query += ` AND al.user_id = $${paramIndex++}`;
    params.push(userId);
  }

  query += ` ORDER BY al.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
  params.push(limit, offset);

  const result = await pool.query(query, params);
  return result.rows;
}
