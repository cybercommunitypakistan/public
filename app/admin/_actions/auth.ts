'use server';
// =============================================================================
// FILE: app/admin/_actions/auth.ts — sign in / sign out
// Defences: honeypot field, IP + account rate limits, account lockout with
// growing delay, identical error for unknown email / wrong password, constant
// bcrypt work either way, session rotation, audit + security log.
// =============================================================================
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { db } from '@/lib/db';
import { User } from '@/lib/models';
import { verifyPassword } from '@/lib/auth/password';
import { createSession, destroySession, getCurrentUser } from '@/lib/auth/session';
import { rateLimit, resetRateLimit } from '@/lib/security/rateLimit';
import { blockIp, checkBot, isBlocked, logSecurityEvent } from '@/lib/security/guard';
import { requestInfo } from '@/lib/security/request';
import { audit } from '@/lib/audit';
import type { ActionState } from '@/components/admin/ActionForm';

const schema = z.object({ email: z.string().trim().toLowerCase().email().max(254), password: z.string().min(1).max(128) });
const GENERIC = 'Email or password is incorrect.';

export async function login(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await db.connect();
  const { ip } = await requestInfo();
  if (await isBlocked(ip)) {
    await logSecurityEvent('blocked_request', 'login from blocked IP');
    return { ok: false, error: GENERIC };
  }

  const bot = await checkBot(fd);
  if (bot.bot) {
    if (bot.reason === 'honeypot') await blockIp(ip, 'login honeypot', 24 * 7);
    await new Promise((r) => setTimeout(r, 800));
    return { ok: false, error: GENERIC };
  }

  const ipLimit = await rateLimit(`login:ip:${ip}`, 10, 15 * 60);
  if (!ipLimit.ok) {
    if (ipLimit.count === 11) await logSecurityEvent('rate_limit', 'login attempts per IP');
    if (ipLimit.count > 40) await blockIp(ip, 'login brute force', 24);
    return { ok: false, error: `Too many attempts. Try again in ${Math.ceil(ipLimit.retryAfter / 60)} min.` };
  }

  const parsed = schema.safeParse({ email: fd.get('email'), password: fd.get('password') });
  if (!parsed.success) return { ok: false, error: GENERIC };
  const { email, password } = parsed.data;

  const acctLimit = await rateLimit(`login:acct:${email}`, 20, 60 * 60);
  const user = await User.findOne({ email }).select('+passwordHash').lean();
  const locked = Boolean(user?.lockedUntil && user.lockedUntil.getTime() > Date.now());
  const valid = await verifyPassword(password, user?.passwordHash); // always runs bcrypt

  if (!user || !valid || locked || user.status !== 'active' || !acctLimit.ok) {
    if (user && !valid) {
      const fails = user.failedLogins + 1;
      const lockMins = fails >= 5 ? Math.min(60, 2 ** (fails - 5) * 5) : 0; // 5, 10, 20, 40, 60 min
      await User.updateOne({ _id: user._id }, { $set: { failedLogins: fails, ...(lockMins ? { lockedUntil: new Date(Date.now() + lockMins * 60_000) } : {}) } });
      if (lockMins) await logSecurityEvent('login_locked', `${email} locked ${lockMins} min after ${fails} failures`);
    }
    await logSecurityEvent('login_failed', `${email}${locked ? ' (locked)' : ''}${user?.status === 'disabled' ? ' (disabled)' : ''}`);
    return { ok: false, error: locked ? 'This account is temporarily locked. Try again later.' : GENERIC };
  }

  await User.updateOne({ _id: user._id }, { $set: { failedLogins: 0, lockedUntil: null, lastLoginAt: new Date(), lastLoginIp: ip } });
  await resetRateLimit(`login:acct:${email}`);
  await destroySession(); // rotate: never reuse a pre-login session
  await createSession(String(user._id));
  await audit({ id: String(user._id), email } as never, 'auth.login', `user:${user._id}`);
  redirect('/admin');
}

export async function logout() {
  const user = await getCurrentUser();
  if (user) await audit(user, 'auth.logout', `user:${user.id}`);
  await destroySession();
  redirect('/admin/login');
}
