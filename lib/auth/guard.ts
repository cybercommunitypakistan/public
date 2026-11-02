// =============================================================================
// FILE: lib/auth/guard.ts
// Use in admin pages (redirects) and server actions (returns an error object).
//   const user = await requirePermission('blog.write')      // page / layout
//   const auth = await authorize('blog.publish'); if (!auth.ok) return auth  // action
// =============================================================================
import 'server-only';
import { redirect } from 'next/navigation';
import { getCurrentUser, type CurrentUser } from './session';
import type { Permission } from './permissions';

export const can = (u: CurrentUser | null, p: Permission) => Boolean(u?.permissions.includes(p));

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect('/admin/login');
  return user;
}

export async function requirePermission(p: Permission) {
  const user = await requireUser();
  if (!can(user, p)) redirect('/admin?denied=1');
  return user;
}

export type ActionResult<T = undefined> = { ok: true; message?: string; data?: T } | { ok: false; error: string; fieldErrors?: Record<string, string> };

export async function authorize(p: Permission): Promise<({ ok: true; user: CurrentUser }) | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Your session has expired. Sign in again.' };
  if (!can(user, p)) return { ok: false, error: 'You don’t have permission to do that.' };
  return { ok: true, user };
}
