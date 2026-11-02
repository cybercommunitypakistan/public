// FILE: app/admin/(panel)/users/page.tsx
import Link from 'next/link';
import { requirePermission } from '@/lib/auth/guard';
import { db } from '@/lib/db';
import { User } from '@/lib/models';
import { Badge, Card, LinkButton, PageHeader, Table, Td, fmtDate } from '@/components/admin/ui';

export const metadata = { title: 'Users' };

export default async function UsersPage() {
  const me = await requirePermission('users.manage');
  await db.connect();
  const users = await User.find().sort({ createdAt: 1 }).populate('role', 'name slug').lean<{ _id: string; name: string; email: string; status: string; lastLoginAt: Date | null; lockedUntil: Date | null; role: { name: string; slug: string } }[]>();
  return (
    <>
      <PageHeader eyebrow="Administration" title="Users" description="Everyone who can sign in to the admin panel. Access is controlled by their role." actions={<LinkButton href="/admin/users/new">+ Add user</LinkButton>} />
      <Card padded={false}>
        <Table head={['Name', 'Role', 'Status', 'Last sign-in', '']}>
          {users.map((u) => {
            const locked = u.lockedUntil && new Date(u.lockedUntil).getTime() > Date.now();
            return (
              <tr key={String(u._id)} className="hover:bg-white/[0.02]">
                <Td>
                  <div className="flex items-center gap-3">
                    <span className="grid size-8 place-items-center rounded-full bg-white/[0.06] text-[12px] font-bold">{u.name.charAt(0).toUpperCase()}</span>
                    <span><Link href={`/admin/users/${u._id}`} className="font-medium text-paper hover:text-emerald">{u.name}</Link>{String(u._id) === me.id && <span className="ml-2 text-[11px] text-paper/40">(you)</span>}<span className="block text-[12px] text-paper/45">{u.email}</span></span>
                  </div>
                </Td>
                <Td><Badge tone={u.role?.slug === 'owner' ? 'blue' : 'neutral'}>{u.role?.name ?? '—'}</Badge></Td>
                <Td>{locked ? <Badge tone="amber">locked</Badge> : <Badge tone={u.status === 'active' ? 'green' : 'red'}>{u.status}</Badge>}</Td>
                <Td className="text-paper/45">{fmtDate(u.lastLoginAt, true)}</Td>
                <Td className="text-right"><Link href={`/admin/users/${u._id}`} className="text-[12.5px] text-paper/50 hover:text-paper">Edit →</Link></Td>
              </tr>
            );
          })}
        </Table>
      </Card>
    </>
  );
}
