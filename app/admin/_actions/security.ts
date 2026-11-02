'use server';
// FILE: app/admin/_actions/security.ts — block / unblock IPs, clear sessions
import { db } from '@/lib/db';
import { BlockedIp, Session } from '@/lib/models';
import { authorize } from '@/lib/auth/guard';
import { audit } from '@/lib/audit';
import { blockIp } from '@/lib/security/guard';
import { requestInfo } from '@/lib/security/request';
import { fail, isId, ok, str } from '@/lib/admin/result';
import type { ActionState } from '@/components/admin/ActionForm';

const IP = /^(?:\d{1,3}\.){3}\d{1,3}$|^[0-9a-f:]{2,39}$/i;

export async function addBlock(_p: ActionState, fd: FormData): Promise<ActionState> {
  const auth = await authorize('security.manage'); if (!auth.ok) return fail(auth.error);
  const ip = str(fd, 'ip', 64), reason = str(fd, 'reason', 200) || 'manual', hours = Number(fd.get('hours') || 0);
  if (!IP.test(ip)) return fail('Enter a valid IPv4 or IPv6 address.', { ip: 'Invalid' });
  const { ip: mine } = await requestInfo();
  if (ip === mine) return fail('That’s your own IP — you would lock yourself out.');
  await db.connect();
  await blockIp(ip, `${reason} (by ${auth.user.email})`, hours > 0 ? Math.min(hours, 24 * 365) : null);
  await audit(auth.user, 'security.block', `ip:${ip}`, { hours });
  return ok(`Blocked ${ip}.`);
}

export async function unblock(id: string) {
  const auth = await authorize('security.manage'); if (!auth.ok) return fail(auth.error);
  if (!isId(id)) return fail('Invalid request.');
  await db.connect();
  const row = await BlockedIp.findByIdAndDelete(id).lean();
  await audit(auth.user, 'security.unblock', `ip:${row?.ip}`);
  return ok();
}

export async function killSession(id: string) {
  const auth = await authorize('users.manage'); if (!auth.ok) return fail(auth.error);
  if (!isId(id)) return fail('Invalid request.');
  await db.connect();
  await Session.deleteOne({ _id: id });
  await audit(auth.user, 'session.revoke', `session:${id}`);
  return ok();
}
