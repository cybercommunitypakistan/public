'use server';
// =============================================================================
// FILE: lib/forms/submit.ts — public form submission / event registration
// Order of checks: blocked IP → rate limits → honeypot & timing → form state
// (open, deadline, limit, capacity) → field validation → duplicate email.
// Bots get a fake "success" so they learn nothing.
// =============================================================================
import { db, hasDatabase } from '@/lib/db';
import { Event, Form, Submission } from '@/lib/models';
import { checkBot, isBlocked, logSecurityEvent } from '@/lib/security/guard';
import { rateLimit } from '@/lib/security/rateLimit';
import { requestInfo } from '@/lib/security/request';
import { hashIp } from '@/lib/security/crypto';
import { sendMail } from '@/lib/mail';
import { buildAnswerSchema, readAnswers, type FormField } from './schema';

export type SubmitState = { status: 'idle' | 'success' | 'error'; message: string; fieldErrors?: Record<string, string> };

const FAKE_OK: SubmitState = { status: 'success', message: 'Thanks — your response has been recorded.' };

export async function submitForm(_prev: SubmitState, fd: FormData): Promise<SubmitState> {
  if (!hasDatabase) return { status: 'error', message: 'Forms are not available right now.' };
  await db.connect();
  const { ip, userAgent } = await requestInfo();

  if (await isBlocked(ip)) {
    await logSecurityEvent('blocked_request', 'form submit from blocked IP');
    return { status: 'error', message: 'We couldn’t accept this submission.' };
  }
  const formId = String(fd.get('_form') ?? '');
  if (!/^[a-f0-9]{24}$/.test(formId)) return { status: 'error', message: 'Invalid form.' };

  // generous enough for a classroom / mobile network sharing one IP, tight enough to stop floods
  const burst = await rateLimit(`form:ip:${ip}`, 25, 10 * 60);
  const perForm = await rateLimit(`form:${formId}:ip:${ip}`, 15, 60 * 60);
  if (!burst.ok || !perForm.ok) {
    if (burst.count === 26 || perForm.count === 16) await logSecurityEvent('rate_limit', `form ${formId}`);
    return { status: 'error', message: `Too many submissions. Try again in ${Math.ceil(Math.max(burst.retryAfter, perForm.retryAfter) / 60)} minutes.` };
  }

  const bot = await checkBot(fd);
  if (bot.bot) return FAKE_OK;

  const form = await Form.findById(formId).lean();
  if (!form) return { status: 'error', message: 'This form no longer exists.' };
  if (form.status !== 'open') return { status: 'error', message: 'This form is closed.' };
  if (form.closesAt && form.closesAt.getTime() < Date.now()) return { status: 'error', message: 'This form is no longer accepting responses.' };

  // event registration?
  const eventId = String(fd.get('_event') ?? '');
  let event: any = null;
  let status: 'new' | 'waitlist' = 'new';
  if (eventId) {
    if (!/^[a-f0-9]{24}$/.test(eventId)) return { status: 'error', message: 'Invalid event.' };
    event = await Event.findOne({ _id: eventId, published: true, form: form._id }).lean();
    if (!event) return { status: 'error', message: 'This event isn’t taking registrations.' };
    if (event.registrationClosesAt && new Date(event.registrationClosesAt).getTime() < Date.now()) return { status: 'error', message: 'Registration has closed.' };
    if (event.capacity > 0) {
      const taken = await Submission.countDocuments({ event: event._id, status: { $in: ['new', 'confirmed'] } });
      if (taken >= event.capacity) {
        if (!event.waitlist) return { status: 'error', message: 'Sorry — this event is full.' };
        status = 'waitlist';
      }
    }
  }
  if (form.limit > 0 && (await Submission.countDocuments({ form: form._id, status: { $ne: 'cancelled' } })) >= form.limit) {
    return { status: 'error', message: 'All places have been filled.' };
  }

  const fields = form.fields as unknown as FormField[];
  const parsed = buildAnswerSchema(fields).safeParse(readAnswers(fields, fd));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) {
      const k = String(i.path[0] ?? '');
      if (k && !fieldErrors[k]) fieldErrors[k] = i.message;
    }
    return { status: 'error', message: 'Please fix the highlighted answers.', fieldErrors };
  }
  const data = parsed.data as Record<string, string | string[] | boolean>;
  const emailField = fields.find((f) => f.type === 'email');
  const email = emailField ? String(data[emailField.id] ?? '').toLowerCase() : '';

  if (email && (form.uniqueEmail || event)) {
    const dup = await Submission.exists({ form: form._id, email, ...(event ? { event: event._id } : {}), status: { $ne: 'cancelled' } });
    if (dup) return { status: 'error', message: event ? 'This email is already registered for this event.' : 'A response with this email already exists.' };
  }

  await Submission.create({ form: form._id, event: event?._id ?? null, data, email, ipHash: hashIp(ip), userAgent, status });

  // emails (only if Resend is configured)
  if (email) {
    const lines = event
      ? [`You're ${status === 'waitlist' ? 'on the waitlist' : 'registered'} for ${event.title}.`, `Date: ${new Date(event.date).toDateString()}${event.startTime ? ` at ${event.startTime} (PKT)` : ''}`,
         ...(event.location ? [`Where: ${event.location}`] : []), ...(event.onlineUrl && status !== 'waitlist' ? [`Join link: ${event.onlineUrl}`] : []), 'See you there — Cyber Community Pakistan']
      : [form.successMessage, '— Cyber Community Pakistan'];
    await sendMail(email, event ? `Registration: ${event.title}` : form.title, lines);
  }
  if (form.notifyEmail) await sendMail(form.notifyEmail, `New response: ${form.title}`, [`A new response was submitted${event ? ` for ${event.title}` : ''}.`, 'Open the admin panel to view it.']);

  return {
    status: 'success',
    message: status === 'waitlist' ? 'The event is full — you’ve been added to the waitlist. We’ll email you if a seat opens.' : form.successMessage,
  };
}
