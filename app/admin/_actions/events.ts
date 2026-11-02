'use server';
// FILE: app/admin/_actions/events.ts — events + registration settings
import { z } from 'zod';
import { db } from '@/lib/db';
import { Event, Form, Submission } from '@/lib/models';
import { authorize } from '@/lib/auth/guard';
import { audit } from '@/lib/audit';
import { refreshContent } from '@/lib/content/revalidate';
import { slugify } from '@/lib/cms/slug';
import { bool, fail, isId, ok, str, zodFail } from '@/lib/admin/result';
import { pktDate } from '@/lib/admin/result';
import type { ActionState } from '@/components/admin/ActionForm';

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a date');
const time = z.union([z.literal(''), z.string().regex(/^\d{2}:\d{2}$/)]);
const link = z.union([z.literal(''), z.string().trim().url().max(500).refine((v) => /^https?:\/\//.test(v), 'http(s) links only')]);

const schema = z.object({
  title: z.string().trim().min(3).max(160),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Lowercase words separated by dashes').max(120),
  type: z.enum(['LECTURE', 'WORKSHOP', 'WEBINAR', 'MEETUP']),
  series: z.string().trim().max(80),
  format: z.string().trim().min(2).max(120),
  description: z.string().trim().min(10).max(600),
  body: z.string().max(50_000),
  date: day, endDate: z.union([z.literal(''), day]), startTime: time, endTime: time,
  location: z.string().trim().max(200), onlineUrl: link, coverUrl: z.string().trim().max(500),
  registration: z.enum(['none', 'form', 'external']), href: link, form: z.string(),
  capacity: z.coerce.number().int().min(0).max(100000), registrationClosesAt: z.string().trim(), waitlist: z.boolean(), published: z.boolean(),
});

export async function saveEvent(_p: ActionState, fd: FormData): Promise<ActionState> {
  const auth = await authorize('events.manage'); if (!auth.ok) return fail(auth.error);
  const id = str(fd, 'id', 24);
  const g = (k: string, m = 500) => str(fd, k, m);
  const parsed = schema.safeParse({
    title: g('title'), slug: slugify(g('slug') || g('title'), 120).replace(/\//g, '-'), type: g('type'), series: g('series'), format: g('format'),
    description: g('description', 700), body: String(fd.get('body') ?? ''), date: g('date'), endDate: g('endDate'), startTime: g('startTime'), endTime: g('endTime'),
    location: g('location'), onlineUrl: g('onlineUrl'), coverUrl: g('coverUrl'), registration: g('registration'), href: g('href'), form: g('form', 24),
    capacity: fd.get('capacity') || 0, registrationClosesAt: g('registrationClosesAt', 30), waitlist: bool(fd, 'waitlist'), published: bool(fd, 'published'),
  });
  if (!parsed.success) return zodFail(parsed.error);
  const d = parsed.data;
  if (d.endDate && d.endDate < d.date) return fail('End date is before the start date.', { endDate: 'Before start' });
  if (d.registration === 'external' && !d.href) return fail('Add the external registration link.', { href: 'Required' });
  await db.connect();
  if (d.registration === 'form' && !(isId(d.form) && (await Form.exists({ _id: d.form })))) return fail('Choose a registration form (create one under Forms).', { form: 'Required' });
  const existing = isId(id) ? await Event.findById(id).lean() : null;
  if (isId(id) && !existing) return fail('Event not found.');
  if (await Event.exists({ slug: d.slug, _id: { $ne: existing?._id } })) return fail('Another event uses this URL slug.', { slug: 'Taken' });
  const closes = pktDate(d.registrationClosesAt);
  if (closes && Number.isNaN(closes.getTime())) return fail('Invalid registration deadline.');

  const doc = {
    ...d, date: new Date(`${d.date}T00:00:00Z`), endDate: d.endDate ? new Date(`${d.endDate}T00:00:00Z`) : null, series: d.series || null,
    coverUrl: d.coverUrl || null, form: d.registration === 'form' ? d.form : null, registrationClosesAt: closes,
    href: d.registration === 'external' ? d.href : '',
  };
  if (existing) {
    await Event.updateOne({ _id: existing._id }, { $set: doc });
    await audit(auth.user, 'event.update', `event:${d.slug}`);
    refreshContent('events');
    return ok('Event saved.');
  }
  const created = await Event.create(doc);
  await audit(auth.user, 'event.create', `event:${d.slug}`);
  refreshContent('events');
  return ok('Event created.', `/admin/events/${created._id}`);
}

export async function deleteEvent(id: string) {
  const auth = await authorize('events.manage'); if (!auth.ok) return fail(auth.error);
  if (!isId(id)) return fail('Invalid request.');
  await db.connect();
  const e = await Event.findById(id).lean();
  if (!e) return fail('Event not found.');
  const regs = await Submission.countDocuments({ event: id });
  if (regs > 0 && !auth.user.permissions.includes('submissions.export')) return fail(`This event has ${regs} registrations. Someone with data permissions must delete it.`);
  await Submission.deleteMany({ event: id });
  await Event.deleteOne({ _id: id });
  await audit(auth.user, 'event.delete', `event:${e.slug ?? id}`, { registrations: regs });
  refreshContent('events');
  return ok('Event deleted.');
}
