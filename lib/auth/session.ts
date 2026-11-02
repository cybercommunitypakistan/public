// =============================================================================
// FILE: lib/auth/session.ts
// Cookie sessions backed by the `sessions` collection.
//   • cookie: random 256-bit token, HttpOnly, Secure (prod), SameSite=Lax,
//     "__Host-" prefix in production (no Domain, Path=/, Secure enforced)
//   • DB: SHA-256 of the token, sliding 8h idle timeout, 7-day absolute limit
//   • changing a password / disabling a user revokes all their sessions
// =============================================================================
import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { Role, Session, User } from '@/lib/models';
import { randomToken, sha256 } from '@/lib/security/crypto';
import { requestInfo } from '@/lib/security/request';
import type { Permission } from './permissions';

// Secure cookies everywhere except a production build served on plain http://localhost
const PROD = process.env.NODE_ENV === 'production' && !(process.env.NEXT_PUBLIC_SITE_URL ?? '').startsWith('http://');
export const SESSION_COOKIE = PROD ? '__Host-ccp_session' : 'ccp_session';
const IDLE_MS = 8 * 3600_000;
const ABSOLUTE_MS = 7 * 24 * 3600_000;

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  roleId: string;
  roleName: string;
  roleSlug: string;
  permissions: Permission[];
  sessionId: string;
};

export async function createSession(userId: string) {
  const token = randomToken(32);
  const { ip, userAgent } = await requestInfo();
  const now = Date.now();
  await Session.create({
    tokenHash: sha256(token),
    user: userId,
    expiresAt: new Date(now + ABSOLUTE_MS),
    idleUntil: new Date(now + IDLE_MS),
    ip,
    userAgent,
  });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: PROD,
    sameSite: 'lax',
    path: '/',
    maxAge: ABSOLUTE_MS / 1000,
    priority: 'high',
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.connect();
    await Session.deleteOne({ tokenHash: sha256(token) });
  }
  jar.delete(SESSION_COOKIE);
}

export const revokeUserSessions = (userId: string, exceptSessionId?: string) =>
  Session.deleteMany({ user: userId, ...(exceptSessionId ? { _id: { $ne: exceptSessionId } } : {}) });

/** The signed-in user for this request (memoised per request). */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || token.length < 30 || token.length > 100) return null;
  await db.connect();
  const now = new Date();
  const session = await Session.findOne({ tokenHash: sha256(token), expiresAt: { $gt: now }, idleUntil: { $gt: now } }).lean();
  if (!session) return null;
  const user = await User.findById(session.user).lean();
  if (!user || user.status !== 'active' || user.passwordChangedAt > session.createdAt) return null;
  const role = await Role.findById(user.role).lean();
  if (!role) return null;
  // slide the idle window at most once a minute
  if (session.idleUntil.getTime() - now.getTime() < IDLE_MS - 60_000) {
    await Session.updateOne({ _id: session._id }, { $set: { idleUntil: new Date(now.getTime() + IDLE_MS) } });
  }
  return {
    id: String(user._id),
    email: user.email,
    name: user.name,
    roleId: String(role._id),
    roleName: role.name,
    roleSlug: role.slug,
    permissions: role.permissions as Permission[],
    sessionId: String(session._id),
  };
});
