import { execute } from '../db';
import crypto from 'node:crypto';

export interface AuditEventParams {
  userId?: string;
  userName?: string;
  userRole?: string;
  action: string;
  entityType: string;
  entityId?: string;
  ipAddress?: string;
  details?: string;
}

export function logAuditEvent(params: AuditEventParams): void {
  try {
    const id = 'log_' + crypto.randomUUID().replace(/-/g, '').substring(0, 16);
    execute(
      `INSERT INTO audit_logs (id, user_id, user_name, user_role, action, entity_type, entity_id, ip_address, details)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        params.userId || null,
        params.userName || 'SYSTEM_GUEST',
        params.userRole || 'PUBLIC',
        params.action,
        params.entityType,
        params.entityId || null,
        params.ipAddress || '127.0.0.1',
        params.details || null,
      ]
    );
  } catch (err) {
    console.error('Failed to write to audit log:', err);
  }
}
