import type { Metadata } from 'next';
import { AuditLogsClient } from '@/components/admin/AuditLogsClient';

export const metadata: Metadata = {
  title: 'Audit Logs - Admin',
  description: 'View system audit logs and activity history',
};

// Disable static generation for this page since it requires authentication
export const dynamic = 'force-dynamic';

export default function AuditLogsPage() {
  return <AuditLogsClient />;
}
