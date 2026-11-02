// FILE: app/admin/(panel)/roles/[id]/page.tsx — permission matrix
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requirePermission } from '@/lib/auth/guard';
import { db } from '@/lib/db';
import { Role } from '@/lib/models';
import { isId } from '@/lib/admin/result';
import { PERMISSION_GROUPS } from '@/lib/auth/permissions';
import ActionForm, { SubmitButton } from '@/components/admin/ActionForm';
import { Card, Field, PageHeader, inputCls } from '@/components/admin/ui';
import { saveRole } from '../../../_actions/users';

export default async function EditRole({ params }: { params: Promise<{ id: string }> }) {
  const me = await requirePermission('roles.manage');
  const { id } = await params;
  await db.connect();
  const r = id === 'new' ? null : isId(id) ? await Role.findById(id).lean() : null;
  if (id !== 'new' && !r) notFound();
  if (r?.system) notFound();
  const has = new Set(r?.permissions ?? ['dashboard.view']);
  return (
    <>
      <PageHeader eyebrow={<Link href="/admin/roles" className="hover:underline">← Roles</Link>} title={r ? r.name : 'New role'} />
      <ActionForm action={saveRole} className="space-y-6">
        <input type="hidden" name="id" value={r ? String(r._id) : ''} />
        <Card>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name"><input name="name" defaultValue={r?.name ?? ''} required className={inputCls} /></Field>
            <Field label="Description"><input name="description" defaultValue={r?.description ?? ''} className={inputCls} /></Field>
          </div>
        </Card>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Object.entries(PERMISSION_GROUPS).map(([group, perms]) => (
            <Card key={group} title={group}>
              <div className="space-y-2.5">
                {Object.entries(perms).map(([key, label]) => {
                  const mine = (me.permissions as string[]).includes(key);
                  return (
                    <label key={key} className={`flex items-start gap-3 text-[13px] ${mine ? 'text-paper/80' : 'text-paper/30'}`} title={mine ? key : 'You don’t have this permission, so you can’t grant it'}>
                      <input type="checkbox" name="permissions" value={key} defaultChecked={has.has(key)} disabled={!mine} className="mt-0.5 size-4 accent-[var(--color-emerald)]" />
                      <span>{label}<span className="block font-mono text-[10px] text-paper/30">{key}</span></span>
                    </label>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
        <SubmitButton>Save role</SubmitButton>
      </ActionForm>
    </>
  );
}
