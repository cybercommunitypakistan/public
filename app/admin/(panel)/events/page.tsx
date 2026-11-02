// FILE: app/admin/(panel)/events/page.tsx
import Link from 'next/link';
import { requirePermission } from '@/lib/auth/guard';
import { db } from '@/lib/db';
import { Event, Submission } from '@/lib/models';
import ConfirmAction from '@/components/admin/ConfirmAction';
import { Badge, Card, EmptyState, LinkButton, PageHeader, Table, Td } from '@/components/admin/ui';
import { deleteEvent } from '../../_actions/events';

export const metadata = { title: 'Events' };

export default async function EventsAdmin() {
  await requirePermission('events.manage');
  await db.connect();
  const events = await Event.find().sort({ date: -1 }).limit(300).lean();
  const counts = Object.fromEntries((await Submission.aggregate([{ $match: { event: { $ne: null }, status: { $ne: 'cancelled' } } }, { $group: { _id: '$event', n: { $sum: 1 } } }])).map((r) => [String(r._id), r.n]));
  const today = new Date().toISOString().slice(0, 10);
  return (
    <>
      <PageHeader eyebrow="Events" title="Events" description="Create events with their own page and registration form. Upcoming events also appear on the home page." actions={<LinkButton href="/admin/events/new">+ New event</LinkButton>} />
      <Card padded={false}>
        {events.length ? (
          <Table head={['Date', 'Event', 'Registration', 'Status', '']}>
            {events.map((e) => {
              const id = String(e._id), d = new Date(e.date).toISOString().slice(0, 10), n = counts[id] ?? 0;
              return (
                <tr key={id} className={`hover:bg-white/[0.02] ${d < today ? 'opacity-55' : ''}`}>
                  <Td className="whitespace-nowrap font-mono text-[12.5px]">{d}{e.startTime ? ` · ${e.startTime}` : ''}</Td>
                  <Td><Link href={`/admin/events/${id}`} className="font-medium text-paper hover:text-emerald">{e.title}</Link><span className="block text-[12px] text-paper/40">{e.type.toLowerCase()} · {e.location || e.format}</span></Td>
                  <Td>
                    {e.registration === 'form' ? <Link href={`/admin/events/${id}/registrations`} className="text-emerald hover:underline">{n}{e.capacity ? ` / ${e.capacity}` : ''} registered</Link>
                      : <span className="text-paper/45">{e.registration === 'external' ? 'External link' : 'None'}</span>}
                  </Td>
                  <Td><Badge tone={e.published ? 'green' : 'neutral'}>{e.published ? 'published' : 'hidden'}</Badge></Td>
                  <Td className="text-right"><ConfirmAction confirm={`Delete “${e.title}”${n ? ` and its ${n} registrations` : ''}?`} action={deleteEvent.bind(null, id)}>Delete</ConfirmAction></Td>
                </tr>
              );
            })}
          </Table>
        ) : <div className="p-5"><EmptyState title="No events yet" action={<LinkButton href="/admin/events/new">Create an event</LinkButton>} /></div>}
      </Card>
    </>
  );
}
