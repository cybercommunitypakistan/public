// =============================================================================
// FILE: lib/forms/schema.ts
// 1. fieldSchema  — validates form definitions saved from the builder
// 2. buildAnswerSchema(fields) — validates a visitor's answers (server side)
// Shared by the client builder and the server.
// =============================================================================
import { z } from 'zod';

export const FIELD_TYPES = ['short_text', 'long_text', 'email', 'phone', 'number', 'url', 'date', 'time', 'select', 'radio', 'checkbox', 'consent', 'heading'] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

export const FIELD_LABELS: Record<FieldType, string> = {
  short_text: 'Short answer', long_text: 'Paragraph', email: 'Email', phone: 'Phone', number: 'Number', url: 'Link',
  date: 'Date', time: 'Time', select: 'Dropdown', radio: 'Multiple choice', checkbox: 'Checkboxes', consent: 'Consent checkbox', heading: 'Section heading',
};
export const HAS_OPTIONS: FieldType[] = ['select', 'radio', 'checkbox'];

export const fieldSchema = z.object({
  id: z.string().regex(/^[a-z0-9_]{2,40}$/, 'Field id: 2–40 lowercase letters, numbers or _'),
  type: z.enum(FIELD_TYPES),
  label: z.string().trim().min(1, 'Every field needs a label').max(200),
  help: z.string().trim().max(400).default(''),
  placeholder: z.string().trim().max(120).default(''),
  required: z.boolean().default(false),
  options: z.array(z.string().trim().min(1).max(120)).max(50).default([]),
  min: z.number().int().min(0).max(100000).nullable().default(null),
  max: z.number().int().min(0).max(100000).nullable().default(null),
  width: z.enum(['full', 'half']).default('full'),
});
export type FormField = z.infer<typeof fieldSchema>;

export const formDefinitionSchema = z
  .object({
    title: z.string().trim().min(2).max(160),
    slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug: lowercase letters, numbers and dashes').max(120),
    description: z.string().trim().max(2000).default(''),
    status: z.enum(['open', 'closed']),
    successMessage: z.string().trim().max(500).default('Thanks — your response has been recorded.'),
    submitLabel: z.string().trim().min(1).max(40).default('Submit'),
    uniqueEmail: z.boolean().default(false),
    limit: z.number().int().min(0).max(1_000_000).default(0),
    closesAt: z.string().trim().default(''),
    notifyEmail: z.union([z.literal(''), z.string().trim().email()]).default(''),
    fields: z.array(fieldSchema).min(1, 'Add at least one field').max(80),
  })
  .superRefine((f, ctx) => {
    const ids = new Set<string>();
    f.fields.forEach((fl, i) => {
      if (ids.has(fl.id)) ctx.addIssue({ code: 'custom', message: `Duplicate field id “${fl.id}”`, path: ['fields', i, 'id'] });
      ids.add(fl.id);
      if (HAS_OPTIONS.includes(fl.type) && fl.options.length < 1) ctx.addIssue({ code: 'custom', message: `“${fl.label}” needs at least one option`, path: ['fields', i] });
    });
    if (f.uniqueEmail && !f.fields.some((x) => x.type === 'email')) ctx.addIssue({ code: 'custom', message: 'One-per-email needs an Email field', path: ['uniqueEmail'] });
  });

const PHONE = /^\+?[0-9 ()-]{7,20}$/;

/** Builds the zod validator for one form's answers. Unknown keys are dropped. */
export function buildAnswerSchema(fields: FormField[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const f of fields) {
    if (f.type === 'heading') continue;
    let s: z.ZodTypeAny;
    const minL = f.min ?? 0, maxL = Math.min(f.max ?? (f.type === 'long_text' ? 5000 : 300), 5000);
    switch (f.type) {
      case 'email': s = z.string().trim().toLowerCase().max(254).email('Enter a valid email'); break;
      case 'phone': s = z.string().trim().regex(PHONE, 'Enter a valid phone number'); break;
      case 'url': s = z.string().trim().max(500).url('Enter a full link (https://…)').refine((v) => /^https?:\/\//i.test(v), 'Link must start with http(s)://'); break;
      case 'number': {
        let n = z.coerce.number({ message: 'Enter a number' });
        if (f.min != null) n = n.min(f.min, `Minimum ${f.min}`);
        if (f.max != null) n = n.max(f.max, `Maximum ${f.max}`);
        s = n.transform(String); break;
      }
      case 'date': s = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a date'); break;
      case 'time': s = z.string().regex(/^\d{2}:\d{2}$/, 'Pick a time'); break;
      case 'select': case 'radio': s = z.enum(f.options as [string, ...string[]], { message: 'Choose an option' }); break;
      case 'checkbox': {
        let a = z.array(z.enum(f.options as [string, ...string[]]));
        if (f.required) a = a.min(1, 'Choose at least one');
        s = a; break;
      }
      case 'consent': s = f.required ? z.literal(true, { message: 'Please tick to continue' }) : z.boolean(); break;
      default: s = z.string().trim().min(minL, `At least ${minL} characters`).max(maxL, `At most ${maxL} characters`);
    }
    if (!f.required && !['checkbox', 'consent'].includes(f.type)) {
      s = z.union([z.literal(''), s]).default('');
    } else if (f.required && ['short_text', 'long_text'].includes(f.type)) {
      s = (s as z.ZodString).min(Math.max(1, minL), 'This question is required');
    }
    shape[f.id] = s;
  }
  return z.object(shape);
}

/** FormData → plain object shaped for buildAnswerSchema */
export function readAnswers(fields: FormField[], fd: FormData) {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    if (f.type === 'heading') continue;
    const key = `f_${f.id}`;
    if (f.type === 'checkbox') out[f.id] = fd.getAll(key).map(String).slice(0, 50);
    else if (f.type === 'consent') out[f.id] = fd.get(key) === 'on';
    else out[f.id] = String(fd.get(key) ?? '').slice(0, 6000);
  }
  return out;
}
