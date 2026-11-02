// FILE: components/cms/FormBlock.tsx — server wrapper: loads the form, issues the timing token
import { getPublicForm } from '@/lib/cms/queries';
import { HONEYPOT_FIELD, TIMING_FIELD, issueFormToken } from '@/lib/security/guard';
import FormRenderer from './FormRenderer';

export default async function FormBlock({ slug, eventId, closedText }: { slug: string; eventId?: string; closedText?: string }) {
  const form = await getPublicForm(slug);
  if (!form) return <p className="text-paper/60">Form not found.</p>;
  if (!form.open) return <p className="rounded-2xl border border-paper/10 bg-paper/[0.03] p-6 text-paper/70">{closedText || form.closedReason}</p>;
  return (
    <FormRenderer formId={form.id} eventId={eventId} fields={form.fields} submitLabel={form.submitLabel}
      token={issueFormToken()} trapName={HONEYPOT_FIELD} timingName={TIMING_FIELD} />
  );
}
