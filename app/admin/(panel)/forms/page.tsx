// FILE: app/admin/(panel)/forms/page.tsx
import Link from 'next/link';
import { requirePermission, can } from '@/lib/auth/guard';
import { db } from '@/lib/db';
import { Event, Form, Submission } from '@/lib/models';
import ConfirmAction from '@/components/admin/ConfirmAction';
import { Badge, Card, EmptyState, LinkButton, PageHeader, Table, Td, fmtDate } from '@/components/admin/ui';
import { deleteForm } from '../../_actions/forms';

export const metadata = { title: 'Forms' };

export default async function FormsAdmin() {
  const user = await requirePermission('forms.manage');
  await db.connect();
  const forms = await Form.find().sort({ updatedAt: -1 }).lean();
  const counts = Object.fromEntries((await Submission.aggregate([{ $group: { _id: '$form', n: { $sum: 1 } } }])).map((r) => [String(r._id), r.n]));
  const usedBy = Object.fromEntries((await Event.find({ form: { $ne: null } }).select('form title').lean()).map((e) => [String(e.form), e.title]));
  return (
    <>
      <PageHeader eyebrow="Events" title="Forms" description="Build forms like Google Forms. Use them for event registration, standalone at /forms/…, or inside any page." actions={<LinkButton href="/admin/forms/new">+ New form</LinkButton>} />
      <Card padded={false}>
        {forms.length ? (
          <Table head={['Form', 'Used by', 'Responses', 'Status', 'Updated', '']}>
            {forms.map((f) => {
              const id = String(f._id);
              return (
                <tr key={id} className="hover:bg-white/[0.02]">
                  <Td><Link href={`/admin/forms/${id}`} className="font-medium text-paper hover:text-emerald">{f.title}</Link><span className="block font-mono text-[11.5px] text-paper/40">/forms/{f.slug} · {f.fields.length} questions</span></Td>
                  <Td className="text-paper/55">{usedBy[id] ? `Event: ${usedBy[id]}` : '—'}</Td>
                  <Td>{can(user, 'submissions.view') ? <Link href={`/admin/forms/${id}/responses`} className="text-emerald hover:underline">{counts[id] ?? 0}</Link> : counts[id] ?? 0}</Td>
                  <Td><Badge tone={f.status === 'open' ? 'green' : 'neutral'}>{f.status}</Badge></Td>
                  <Td className="text-paper/45">{fmtDate(f.updatedAt)}</Td>
                  <Td className="text-right"><div className="flex justify-end gap-1.5">
                    <a href={`/forms/${f.slug}`} target="_blank" className="rounded-lg px-2.5 py-1.5 text-[12.5px] text-paper/50 hover:text-paper">Open ↗</a>
                    <ConfirmAction confirm={`Delete “${f.title}” and all its responses?`} action={deleteForm.bind(null, id)}>Delete</ConfirmAction>
                  </div></Td>
                </tr>
              );
            })}
          </Table>
        ) : <div className="p-5"><EmptyState title="No forms yet" body="Start with an event registration form." action={<LinkButton href="/admin/forms/new">Build a form</LinkButton>} /></div>}
      </Card>
    </>
  );
}
