// FILE: app/admin/(panel)/events/[id]/registrations/page.tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requirePermission } from '@/lib/auth/guard';
import { db } from '@/lib/db';
import { Event, Form, Submission } from '@/lib/models';
import { isId } from '@/lib/admin/result';
import Responses from '@/components/admin/Responses';
import { Card, PageHeader } from '@/components/admin/ui';
import type { FormField } from '@/lib/forms/schema';

export default async function Registrations({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission('submissions.view');
  const { id } = await params;
  if (!isId(id)) notFound();
  await db.connect();
  const event = await Event.findById(id).lean();
  if (!event) notFound();
  const form = event.form ? await Form.findById(event.form).lean() : null;
  const [rows, total, byStatus] = await Promise.all([
    Submission.find({ event: id }).sort({ createdAt: -1 }).limit(300).lean(),
    Submission.countDocuments({ event: id }),
    Submission.aggregate([{ $match: { event: event._id } }, { $group: { _id: '$status', n: { $sum: 1 } } }]),
  ]);
  const s = Object.fromEntries(byStatus.map((r) => [r._id, r.n])) as Record<string, number>;
  const seats = (s.new ?? 0) + (s.confirmed ?? 0);
  return (
    <>
      <PageHeader eyebrow={<Link href={`/admin/events/${id}`} className="hover:underline">← {event.title}</Link>} title="Registrations" />
      <div className="mb-6 grid gap-3 sm:grid-cols-4">
        {[['Seats taken', `${seats}${event.capacity ? ` / ${event.capacity}` : ''}`], ['Confirmed', s.confirmed ?? 0], ['Waitlist', s.waitlist ?? 0], ['Cancelled', s.cancelled ?? 0]].map(([l, v]) => (
          <Card key={l as string}><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-paper/45">{l}</p><p className="mt-2 font-display text-3xl font-black">{v}</p></Card>
        ))}
      </div>
      {form ? <Responses user={user} total={total} fields={JSON.parse(JSON.stringify(form.fields)) as FormField[]} rows={JSON.parse(JSON.stringify(rows))} exportHref={`/api/admin/export?event=${id}`} />
        : <p className="text-paper/55">This event doesn’t use an on-site form.</p>}
    </>
  );
}
