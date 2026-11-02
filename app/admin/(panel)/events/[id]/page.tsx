// FILE: app/admin/(panel)/events/[id]/page.tsx — event editor
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requirePermission, can } from '@/lib/auth/guard';
import { db } from '@/lib/db';
import { Event, Form } from '@/lib/models';
import { isId } from '@/lib/admin/result';
import ActionForm, { FieldError, SubmitButton } from '@/components/admin/ActionForm';
import MarkdownEditor from '@/components/admin/MarkdownEditor';
import ImageField from '@/components/admin/ImageField';
import { Card, Field, PageHeader, inputCls } from '@/components/admin/ui';
import { saveEvent } from '../../../_actions/events';
import RegistrationFields from './RegistrationFields';

const day = (d?: Date | null) => (d ? new Date(d).toISOString().slice(0, 10) : '');
const local = (d?: Date | null) => (d ? new Date(new Date(d).getTime() + 5 * 3600_000).toISOString().slice(0, 16) : '');

export default async function EditEvent({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission('events.manage');
  const { id } = await params;
  await db.connect();
  const e = id === 'new' ? null : isId(id) ? await Event.findById(id).lean() : null;
  if (id !== 'new' && !e) notFound();
  const forms = (await Form.find().select('title slug').sort({ updatedAt: -1 }).lean()).map((f) => ({ id: String(f._id), title: f.title }));

  return (
    <>
      <PageHeader eyebrow={<Link href="/admin/events" className="hover:underline">← Events</Link>} title={e ? e.title : 'New event'}
        actions={e && <>
          {e.registration === 'form' && can(user, 'submissions.view') && <Link href={`/admin/events/${id}/registrations`} className="rounded-xl border border-white/12 px-4 py-2.5 text-[13.5px] hover:border-white/25">Registrations</Link>}
          {e.published && e.slug && <a href={`/events/${e.slug}`} target="_blank" className="rounded-xl border border-white/12 px-4 py-2.5 text-[13.5px] hover:border-white/25">View ↗</a>}
        </>} />
      <ActionForm action={saveEvent} className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <input type="hidden" name="id" value={e ? String(e._id) : ''} />
        <div className="space-y-6">
          <Card title="Basics">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Title" className="sm:col-span-2"><input name="title" defaultValue={e?.title ?? ''} required className={inputCls} /><FieldError name="title" /></Field>
              <Field label="Type">
                <select name="type" defaultValue={e?.type ?? 'WORKSHOP'} className={inputCls}>
                  {['LECTURE', 'WORKSHOP', 'WEBINAR', 'MEETUP'].map((t) => <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>)}
                </select>
              </Field>
              <Field label="Series" hint="Optional, e.g. CS101"><input name="series" defaultValue={e?.series ?? ''} className={inputCls} /></Field>
              <Field label="Short description" className="sm:col-span-2" hint="1–2 sentences for lists and previews"><textarea name="description" defaultValue={e?.description ?? ''} rows={2} required className={inputCls} /><FieldError name="description" /></Field>
            </div>
          </Card>
          <Card title="When & where">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Date"><input type="date" name="date" defaultValue={day(e?.date)} required className={inputCls} /><FieldError name="date" /></Field>
              <Field label="End date" hint="For multi-day events"><input type="date" name="endDate" defaultValue={day(e?.endDate)} className={inputCls} /><FieldError name="endDate" /></Field>
              <Field label="Starts (PKT)"><input type="time" name="startTime" defaultValue={e?.startTime ?? ''} className={inputCls} /></Field>
              <Field label="Ends (PKT)"><input type="time" name="endTime" defaultValue={e?.endTime ?? ''} className={inputCls} /></Field>
              <Field label="Format" hint="e.g. Online · Zoom, or In person"><input name="format" defaultValue={e?.format ?? 'Online'} required className={inputCls} /></Field>
              <Field label="Venue / location"><input name="location" defaultValue={e?.location ?? ''} className={inputCls} /></Field>
              <Field label="Online join link" className="sm:col-span-2" hint="Never shown on the page — emailed to registrants only"><input type="url" name="onlineUrl" defaultValue={e?.onlineUrl ?? ''} className={inputCls} /></Field>
            </div>
          </Card>
          <div>
            <p className="mb-2 text-[13px] font-semibold">Details (Markdown)</p>
            <MarkdownEditor name="body" defaultValue={e?.body ?? ''} rows={14} />
          </div>
        </div>
        <div className="space-y-6 xl:sticky xl:top-8 xl:self-start">
          <Card title="Publish">
            <div className="grid gap-4">
              <label className="flex items-center gap-3 text-[13.5px] text-paper/75"><input type="checkbox" name="published" defaultChecked={e?.published ?? true} className="size-4 accent-[var(--color-emerald)]" />Published</label>
              <Field label="URL slug" hint="/events/…"><input name="slug" defaultValue={e?.slug ?? ''} placeholder="auto from title" className={`${inputCls} font-mono text-[13px]`} /><FieldError name="slug" /></Field>
              <Field label="Cover image"><ImageField name="coverUrl" defaultValue={e?.coverUrl ?? ''} /></Field>
              <SubmitButton className="w-full">{e ? 'Save event' : 'Create event'}</SubmitButton>
            </div>
          </Card>
          <Card title="Registration">
            <RegistrationFields forms={forms} initial={{
              registration: e?.registration ?? 'form', form: e?.form ? String(e.form) : '', href: e?.href ?? '',
              capacity: e?.capacity ?? 0, closesAt: local(e?.registrationClosesAt), waitlist: e?.waitlist ?? false,
            }} />
          </Card>
        </div>
      </ActionForm>
    </>
  );
}
