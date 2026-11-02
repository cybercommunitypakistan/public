// FILE: app/admin/(panel)/roles/page.tsx
import Link from 'next/link';
import { requirePermission } from '@/lib/auth/guard';
import { db } from '@/lib/db';
import { Role, User } from '@/lib/models';
import { ALL_PERMISSIONS } from '@/lib/auth/permissions';
import ConfirmAction from '@/components/admin/ConfirmAction';
import { Badge, Card, LinkButton, PageHeader } from '@/components/admin/ui';
import { deleteRole } from '../../_actions/users';

export const metadata = { title: 'Roles' };

export default async function RolesPage() {
  await requirePermission('roles.manage');
  await db.connect();
  const roles = await Role.find().sort({ system: -1, createdAt: 1 }).lean();
  const counts = Object.fromEntries((await User.aggregate([{ $group: { _id: '$role', n: { $sum: 1 } } }])).map((r) => [String(r._id), r.n]));
  return (
    <>
      <PageHeader eyebrow="Administration" title="Roles" description="A role is a set of permissions. Users get exactly one role." actions={<LinkButton href="/admin/roles/new">+ New role</LinkButton>} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {roles.map((r) => (
          <Card key={String(r._id)}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[16px] font-semibold">{r.name} {r.system && <Badge tone="blue">system</Badge>}</p>
                <p className="mt-1 text-[12.5px] text-paper/50">{r.description}</p>
              </div>
              <span className="font-display text-2xl font-black text-paper/30">{counts[String(r._id)] ?? 0}</span>
            </div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-emerald" style={{ width: `${(r.permissions.length / ALL_PERMISSIONS.length) * 100}%` }} /></div>
            <p className="mt-1.5 font-mono text-[10.5px] text-paper/40">{r.permissions.length} / {ALL_PERMISSIONS.length} permissions</p>
            <div className="mt-4 flex gap-2">
              {!r.system && <Link href={`/admin/roles/${r._id}`} className="rounded-lg border border-white/12 px-3 py-1.5 text-[12.5px] hover:border-white/25">Edit</Link>}
              {!r.system && <ConfirmAction confirm={`Delete the ${r.name} role?`} action={deleteRole.bind(null, String(r._id))}>Delete</ConfirmAction>}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
