'use server';
// FILE: app/admin/_actions/users.ts — users & roles (with privilege checks)
import { z } from 'zod';
import type { Types } from 'mongoose';
import { db } from '@/lib/db';
import { Role, User } from '@/lib/models';
import { authorize } from '@/lib/auth/guard';
import { hashPassword, passwordProblem, verifyPassword } from '@/lib/auth/password';
import { getCurrentUser, revokeUserSessions } from '@/lib/auth/session';
import { audit } from '@/lib/audit';
import { isPermission } from '@/lib/auth/permissions';
import { slugify } from '@/lib/cms/slug';
import { fail, isId, ok, str, zodFail } from '@/lib/admin/result';
import type { ActionState } from '@/components/admin/ActionForm';

/** Can't hand out permissions you don't have yourself (prevents privilege escalation). */
async function roleWithinActor(roleId: string, actorPerms: string[]) {
  const role = await Role.findById(roleId).lean();
  if (!role) return { error: 'Role not found.' as const };
  if (role.permissions.some((p) => !actorPerms.includes(p))) return { error: 'You can’t assign a role with more rights than your own.' as const };
  return { role };
}

const userSchema = z.object({ name: z.string().trim().min(2).max(80), email: z.string().trim().toLowerCase().email().max(254), role: z.string().refine(isId, 'Choose a role'), status: z.enum(['active', 'disabled']) });

export async function saveUser(_p: ActionState, fd: FormData): Promise<ActionState> {
  const auth = await authorize('users.manage'); if (!auth.ok) return fail(auth.error);
  const id = str(fd, 'id', 24);
  const parsed = userSchema.safeParse({ name: str(fd, 'name'), email: str(fd, 'email'), role: str(fd, 'role', 24), status: str(fd, 'status') || 'active' });
  if (!parsed.success) return zodFail(parsed.error);
  const d = parsed.data;
  const password = String(fd.get('password') ?? '');
  await db.connect();
  const check = await roleWithinActor(d.role, auth.user.permissions);
  if ('error' in check) return fail(check.error!);

  const existing = isId(id) ? await User.findById(id).populate('role').lean<{ _id: Types.ObjectId; role: { _id: Types.ObjectId; slug: string; permissions: string[] }; status: string }>() : null;
  if (isId(id) && !existing) return fail('User not found.');
  if (existing && existing.role.permissions.some((p) => !(auth.user.permissions as string[]).includes(p))) return fail('You can’t edit a user with more rights than you.');
  if (existing && String(existing._id) === auth.user.id && (d.status === 'disabled' || d.role !== auth.user.roleId)) return fail('You can’t change your own role or disable yourself.');
  if (existing?.role.slug === 'owner' && check.role!.slug !== 'owner') {
    const ownerRole = await Role.findOne({ slug: 'owner' }).lean();
    if ((await User.countDocuments({ role: ownerRole?._id, status: 'active' })) <= 1) return fail('There must always be at least one active owner.');
  }
  if (await User.exists({ email: d.email, _id: { $ne: existing?._id } })) return fail('A user with this email already exists.', { email: 'Taken' });

  if (!existing || password) {
    const problem = passwordProblem(password, d.email);
    if (problem) return fail(problem, { password: problem });
  }
  if (existing) {
    const set: Record<string, unknown> = { ...d };
    if (password) { set.passwordHash = await hashPassword(password); set.passwordChangedAt = new Date(); }
    await User.updateOne({ _id: existing._id }, { $set: set });
    if (password || d.status === 'disabled' || d.role !== String(existing.role._id)) await revokeUserSessions(String(existing._id));
    await audit(auth.user, 'user.update', `user:${d.email}`, { role: check.role!.slug, status: d.status, passwordReset: Boolean(password) });
    return ok('User saved.');
  }
  const created = await User.create({ ...d, passwordHash: await hashPassword(password) });
  await audit(auth.user, 'user.create', `user:${d.email}`, { role: check.role!.slug });
  return ok('User created. Share the password with them securely — they should change it after signing in.', `/admin/users/${created._id}`);
}

export async function revokeSessions(userId: string) {
  const auth = await authorize('users.manage'); if (!auth.ok) return fail(auth.error);
  if (!isId(userId)) return fail('Invalid request.');
  await db.connect();
  await revokeUserSessions(userId, userId === auth.user.id ? auth.user.sessionId : undefined);
  await audit(auth.user, 'user.revoke_sessions', `user:${userId}`);
  return ok('Signed out everywhere.');
}

export async function deleteUser(userId: string) {
  const auth = await authorize('users.manage'); if (!auth.ok) return fail(auth.error);
  if (!isId(userId) || userId === auth.user.id) return fail('You can’t delete yourself.');
  await db.connect();
  const u = await User.findById(userId).populate('role').lean<{ email: string; role: { slug: string; permissions: string[] } }>();
  if (!u) return fail('User not found.');
  if (u.role.permissions.some((p) => !(auth.user.permissions as string[]).includes(p))) return fail('You can’t delete a user with more rights than you.');
  if (u.role.slug === 'owner') return fail('Owners can’t be deleted — change their role first.');
  await User.deleteOne({ _id: userId });
  await revokeUserSessions(userId);
  await audit(auth.user, 'user.delete', `user:${u.email}`);
  return ok('User deleted.');
}

// ---------- roles --------------------------------------------------------------------
export async function saveRole(_p: ActionState, fd: FormData): Promise<ActionState> {
  const auth = await authorize('roles.manage'); if (!auth.ok) return fail(auth.error);
  const id = str(fd, 'id', 24);
  const name = str(fd, 'name', 60), description = str(fd, 'description', 240);
  if (name.length < 2) return fail('Give the role a name.', { name: 'Required' });
  const permissions = [...new Set(fd.getAll('permissions').map(String))].filter(isPermission);
  if (permissions.some((p) => !auth.user.permissions.includes(p))) return fail('You can’t grant permissions you don’t have.');
  await db.connect();
  const existing = isId(id) ? await Role.findById(id).lean() : null;
  if (existing?.system) return fail('The Owner role always has every permission.');
  const slug = existing?.slug ?? slugify(name, 60).replace(/\//g, '-');
  if (!existing && (await Role.exists({ slug }))) return fail('A role with this name exists.');
  if (existing) await Role.updateOne({ _id: existing._id }, { $set: { name, description, permissions } });
  else await Role.create({ name, slug, description, permissions });
  await audit(auth.user, existing ? 'role.update' : 'role.create', `role:${slug}`, { permissions });
  return ok('Role saved.', '/admin/roles');
}

export async function deleteRole(id: string) {
  const auth = await authorize('roles.manage'); if (!auth.ok) return fail(auth.error);
  if (!isId(id)) return fail('Invalid request.');
  await db.connect();
  const r = await Role.findById(id).lean();
  if (!r) return fail('Role not found.');
  if (r.system) return fail('System roles can’t be deleted.');
  const n = await User.countDocuments({ role: id });
  if (n) return fail(`${n} user(s) still have this role.`);
  await Role.deleteOne({ _id: id });
  await audit(auth.user, 'role.delete', `role:${r.slug}`);
  return ok('Role deleted.');
}

// ---------- own account ------------------------------------------------------------
export async function changeOwnPassword(_p: ActionState, fd: FormData): Promise<ActionState> {
  const me = await getCurrentUser(); if (!me) return fail('Sign in again.');
  const current = String(fd.get('current') ?? ''), next = String(fd.get('next') ?? ''), confirm = String(fd.get('confirm') ?? '');
  await db.connect();
  const user = await User.findById(me.id).select('+passwordHash').lean();
  if (!user || !(await verifyPassword(current, user.passwordHash))) return fail('Current password is incorrect.', { current: 'Incorrect' });
  if (next !== confirm) return fail('The new passwords don’t match.', { confirm: 'Doesn’t match' });
  if (next === current) return fail('Choose a different password.');
  const problem = passwordProblem(next, me.email); if (problem) return fail(problem, { next: problem });
  await User.updateOne({ _id: me.id }, { $set: { passwordHash: await hashPassword(next), passwordChangedAt: new Date() } });
  await revokeUserSessions(me.id);
  await audit(me, 'account.password', `user:${me.email}`);
  return ok('Password changed. Sign in again with the new password.', '/admin/login');
}

export async function updateOwnName(_p: ActionState, fd: FormData): Promise<ActionState> {
  const me = await getCurrentUser(); if (!me) return fail('Sign in again.');
  const name = str(fd, 'name', 80);
  if (name.length < 2) return fail('Name is too short.');
  await db.connect();
  await User.updateOne({ _id: me.id }, { $set: { name } });
  return ok('Profile saved.');
}
