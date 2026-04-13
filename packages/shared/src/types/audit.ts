export interface AuditLog {
  id: number;
  userId: number;
  user?: { id: number; fullName: string };
  recordType: string;
  recordId: number;
  action: string;
  changes?: Record<string, { old: unknown; new: unknown }> | null;
  createdAt: string;
}
