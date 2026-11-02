// =============================================================================
// FILE: lib/audit.ts — record admin actions (never throws)
// =============================================================================
import 'server-only';
import { AuditLog } from '@/lib/models';
import { requestInfo } from '@/lib/security/request';
import type { CurrentUser } from '@/lib/auth/session';

export async function audit(actor: CurrentUser | { id: null; email: string }, action: string, target = '', meta: Record<string, unknown> = {}) {
  try {
    const { ip } = await requestInfo();
    await AuditLog.create({ actor: actor.id, actorEmail: actor.email, action, target, ip, meta });
  } catch (e) {
    console.error('[audit] failed', e);
  }
}
