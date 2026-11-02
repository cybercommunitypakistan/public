// FILE: app/admin/(panel)/users/[id]/page.tsx — create / edit user
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requirePermission } from '@/lib/auth/guard';
import { db } from '@/lib/db';
import { Role, Session, User } from '@/lib/models';
import { isId } from '@/lib/admin/result';
import ActionForm, { FieldError, SubmitButton } from '@/components/admin/ActionForm';
import ConfirmAction from '@/components/admin/ConfirmAction';
import { Card, Field, PageHeader, fmtDate, inputCls } from '@/components/admin/ui';
import { deleteUser, revokeSessions, saveUser } from '../../../_actions/users';

export default async function EditUser({ params }: { params: Promise<{ id: string }> }) {
  const me = await requirePermission('users.manage');
  const { id } = await params;
  await db.connect();
  const u = id === 'new' ? null : isId(id) ? await User.findById(id).lean() : null;
  if (id !== 'new' && !u) notFound();
  const roles = (await Role.find().sort({ system: -1, name: 1 }).lean()).filter((r) => r.permissions.every((p) => (me.permissions as string[]).includes(p)));
  const sessions = u ? await Session.find({ user: u._id, expiresAt: { $gt: new Date() } }).sort({ createdAt: -1 }).lean() : [];
  return (
    <>
      <PageHeader eyebrow={<Link href="/admin/users" className="hover:underline">← Users</Link>} title={u ? u.name : 'Add user'}
        actions={u && String(u._id) !== me.id ? <ConfirmAction confirm={`Delete ${u.email}? This can’t be undone.`} action={deleteUser.bind(null, String(u._id))} redirectTo="/admin/users">Delete user</ConfirmAction> : null} />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <Card title="Account">
          <ActionForm action={saveUser} className="grid gap-4 sm:grid-cols-2">
            <input type="hidden" name="id" value={u ? String(u._id) : ''} />
            <Field label="Full name"><input name="name" defaultValue={u?.name ?? ''} required className={inputCls} /></Field>
            <Field label="Email"><input name="email" type="email" defaultValue={u?.email ?? ''} required className={inputCls} /><FieldError name="email" /></Field>
            <Field label="Role">
              <select name="role" defaultValue={u ? String(u.role) : roles.find((r) => r.slug === 'editor')?._id.toString()} className={inputCls}>
                {roles.map((r) => <option key={String(r._id)} value={String(r._id)}>{r.name}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select name="status" defaultValue={u?.status ?? 'active'} className={inputCls}><option value="active">Active</option><option value="disabled">Disabled</option></select>
            </Field>
            <Field label={u ? 'Set a new password' : 'Password'} className="sm:col-span-2" hint="12+ characters, mix of letters, numbers and symbols. Leave empty to keep the current one.">
              <input name="password" type="password" autoComplete="new-password" required={!u} className={inputCls} /><FieldError name="password" />
            </Field>
            <div className="sm:col-span-2"><SubmitButton>{u ? 'Save user' : 'Create user'}</SubmitButton></div>
          </ActionForm>
        </Card>
        {u && (
          <Card title="Sign-in" actions={<ConfirmAction variant="secondary" confirm="Sign this user out on every device?" action={revokeSessions.bind(null, String(u._id))}>Sign out everywhere</ConfirmAction>}>
            <dl className="grid grid-cols-2 gap-3 text-[13px]">
              <div><dt className="text-paper/45">Last sign-in</dt><dd>{fmtDate(u.lastLoginAt, true)}</dd></div>
              <div><dt className="text-paper/45">From IP</dt><dd className="font-mono">{u.lastLoginIp ?? '—'}</dd></div>
              <div><dt className="text-paper/45">Failed attempts</dt><dd>{u.failedLogins}</dd></div>
              <div><dt className="text-paper/45">Password changed</dt><dd>{fmtDate(u.passwordChangedAt)}</dd></div>
            </dl>
            <p className="mb-2 mt-5 font-mono text-[10px] uppercase tracking-[0.18em] text-paper/40">Active sessions · {sessions.length}</p>
            <ul className="space-y-2">{sessions.map((s) => <li key={String(s._id)} className="rounded-lg bg-white/[0.03] px-3 py-2 text-[12px]"><span className="font-mono">{s.ip}</span> · {fmtDate(s.createdAt, true)}<span className="block truncate text-paper/40">{s.userAgent}</span></li>)}</ul>
          </Card>
        )}
      </div>
    </>
  );
}
