// =============================================================================
// FILE: lib/security/guard.ts
// Honeypots, bot checks, IP blocking and security event logging.
//
// Every public form renders <BotFields /> which adds:
//   • a hidden text input real people never see or fill  (name: HONEYPOT_FIELD)
//   • a signed render timestamp                           (name: TIMING_FIELD)
// checkBot() rejects submissions that fill the trap, arrive faster than a human
// could type, or carry a forged/expired timestamp. Repeat offenders are blocked.
// =============================================================================
import 'server-only';
import { BlockedIp, SecurityEvent, SiteSettings, type SecurityEventType } from '@/lib/models';
import { sign, unsign } from './crypto';
import { requestInfo } from './request';

export const HONEYPOT_FIELD = 'website_url';
export const TIMING_FIELD = '_ft';

export async function logSecurityEvent(type: SecurityEventType, detail = '', extra?: { ip?: string; path?: string; userAgent?: string }) {
  try {
    const info = extra?.ip ? { ip: extra.ip, path: extra.path ?? '', userAgent: extra.userAgent ?? '' } : await requestInfo();
    await SecurityEvent.create({ type, detail: detail.slice(0, 500), ...info });
  } catch (e) {
    console.error('[security] log failed', e);
  }
}

export async function blockIp(ip: string, reason: string, hours: number | null = 24) {
  if (!ip || ip === '0.0.0.0') return;
  await BlockedIp.updateOne(
    { ip },
    { $set: { reason, until: hours ? new Date(Date.now() + hours * 3600_000) : null }, $inc: { hits: 1 } },
    { upsert: true },
  );
}

export async function isBlocked(ip: string): Promise<boolean> {
  const row = await BlockedIp.findOne({ ip }).lean();
  if (!row) return false;
  if (row.until && row.until.getTime() < Date.now()) return false;
  await BlockedIp.updateOne({ _id: row._id }, { $inc: { hits: 1 } });
  return true;
}

/** Signed "form rendered at" token, created on the server when the form is rendered */
export const issueFormToken = () => sign(`f:${Date.now()}`);

export type BotCheck = { bot: false } | { bot: true; reason: SecurityEventType };

export async function checkBot(fd: FormData): Promise<BotCheck> {
  const { ip } = await requestInfo();
  const settings = await SiteSettings.findOne().select('security').lean();
  const minSeconds = settings?.security?.minFormSeconds ?? 3;
  const blockAfter = settings?.security?.blockAfterHoneypotHits ?? 2;

  const trap = String(fd.get(HONEYPOT_FIELD) ?? '');
  if (trap) {
    await logSecurityEvent('honeypot', `trap field filled: "${trap.slice(0, 80)}"`);
    const hits = await SecurityEvent.countDocuments({ ip, type: 'honeypot', createdAt: { $gt: new Date(Date.now() - 86400_000) } });
    if (hits >= blockAfter) await blockIp(ip, 'honeypot', 24 * 7);
    return { bot: true, reason: 'honeypot' };
  }

  const payload = unsign(String(fd.get(TIMING_FIELD) ?? ''));
  const issued = payload?.startsWith('f:') ? Number(payload.slice(2)) : NaN;
  if (!Number.isFinite(issued) || Date.now() - issued > 6 * 3600_000) {
    await logSecurityEvent('bad_token', 'missing, forged or expired form token');
    return { bot: true, reason: 'bad_token' };
  }
  if (Date.now() - issued < minSeconds * 1000) {
    await logSecurityEvent('too_fast', `submitted ${((Date.now() - issued) / 1000).toFixed(1)}s after render`);
    return { bot: true, reason: 'too_fast' };
  }
  return { bot: false };
}
