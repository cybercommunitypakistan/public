'use server';
// FILE: app/admin/_actions/forms.ts — form builder + responses
import { db } from '@/lib/db';
import { Event, Form, Submission } from '@/lib/models';
import { authorize } from '@/lib/auth/guard';
import { audit } from '@/lib/audit';
import { refreshContent } from '@/lib/content/revalidate';
import { formDefinitionSchema } from '@/lib/forms/schema';
import { fail, isId, ok, readJson, zodFail } from '@/lib/admin/result';
import { pktDate } from '@/lib/admin/result';
import type { ActionState } from '@/components/admin/ActionForm';

export async function saveForm(_p: ActionState, fd: FormData): Promise<ActionState> {
  const auth = await authorize('forms.manage'); if (!auth.ok) return fail(auth.error);
  const id = String(fd.get('id') ?? '');
  let data: unknown; try { data = readJson(fd); } catch { return fail('Could not read the form.'); }
  const parsed = formDefinitionSchema.safeParse(data);
  if (!parsed.success) return zodFail(parsed.error);
  const d = parsed.data;
  const closesAt = pktDate(d.closesAt);
  if (closesAt && Number.isNaN(closesAt.getTime())) return fail('Invalid closing date.');
  await db.connect();
  const existing = isId(id) ? await Form.findById(id).lean() : null;
  if (isId(id) && !existing) return fail('Form not found.');
  if (await Form.exists({ slug: d.slug, _id: { $ne: existing?._id } })) return fail('Another form uses this URL slug.', { slug: 'Taken' });
  const doc = { ...d, closesAt };
  if (existing) {
    await Form.updateOne({ _id: existing._id }, { $set: doc });
    await audit(auth.user, 'form.update', `form:${d.slug}`, { fields: d.fields.length });
    refreshContent('forms', 'events');
    return ok('Form saved.');
  }
  const created = await Form.create({ ...doc, createdBy: auth.user.id });
  await audit(auth.user, 'form.create', `form:${d.slug}`);
  refreshContent('forms');
  return ok('Form created.', `/admin/forms/${created._id}`);
}

export async function deleteForm(id: string) {
  const auth = await authorize('forms.manage'); if (!auth.ok) return fail(auth.error);
  if (!isId(id)) return fail('Invalid request.');
  await db.connect();
  if (await Event.exists({ form: id })) return fail('An event uses this form for registration. Change the event first.');
  const n = await Submission.countDocuments({ form: id });
  if (n > 0 && !auth.user.permissions.includes('submissions.export')) return fail(`This form has ${n} responses. Someone with data permissions must delete it.`);
  const f = await Form.findByIdAndDelete(id).lean();
  await Submission.deleteMany({ form: id });
  await audit(auth.user, 'form.delete', `form:${f?.slug ?? id}`, { responses: n });
  refreshContent('forms');
  return ok('Form deleted.');
}

export async function setSubmissionStatus(id: string, status: 'new' | 'confirmed' | 'waitlist' | 'cancelled') {
  const auth = await authorize('submissions.view'); if (!auth.ok) return fail(auth.error);
  if (!isId(id) || !['new', 'confirmed', 'waitlist', 'cancelled'].includes(status)) return fail('Invalid request.');
  await db.connect();
  await Submission.updateOne({ _id: id }, { $set: { status } });
  await audit(auth.user, 'submission.status', `submission:${id}`, { status });
  return ok();
}

export async function deleteSubmission(id: string) {
  const auth = await authorize('submissions.export'); if (!auth.ok) return fail(auth.error);
  if (!isId(id)) return fail('Invalid request.');
  await db.connect();
  await Submission.deleteOne({ _id: id });
  await audit(auth.user, 'submission.delete', `submission:${id}`);
  return ok();
}
