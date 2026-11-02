// FILE: app/admin/(panel)/forms/[id]/page.tsx — form builder
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requirePermission, can } from '@/lib/auth/guard';
import { db } from '@/lib/db';
import { Form } from '@/lib/models';
import { isId } from '@/lib/admin/result';
import FormBuilder from '@/components/admin/FormBuilder';
import { PageHeader } from '@/components/admin/ui';
import { saveForm } from '../../../_actions/forms';
import type { FormField } from '@/lib/forms/schema';

const local = (d?: Date | null) => (d ? new Date(new Date(d).getTime() + 5 * 3600_000).toISOString().slice(0, 16) : '');

const STARTER: FormField[] = [
  { id: 'full_name', type: 'short_text', label: 'Full name', help: '', placeholder: '', required: true, options: [], min: 2, max: 80, width: 'half' },
  { id: 'email', type: 'email', label: 'Email', help: 'We’ll send your confirmation here.', placeholder: 'you@example.com', required: true, options: [], min: null, max: null, width: 'half' },
  { id: 'phone', type: 'phone', label: 'WhatsApp number', help: '', placeholder: '+92 3xx xxxxxxx', required: false, options: [], min: null, max: null, width: 'half' },
  { id: 'city', type: 'short_text', label: 'City', help: '', placeholder: '', required: true, options: [], min: null, max: 60, width: 'half' },
  { id: 'level', type: 'radio', label: 'Your experience level', help: '', placeholder: '', required: true, options: ['Beginner', 'Intermediate', 'Advanced'], min: null, max: null, width: 'full' },
  { id: 'consent', type: 'consent', label: 'I agree to the CCP code of conduct', help: '', placeholder: '', required: true, options: [], min: null, max: null, width: 'full' },
];

export default async function EditForm({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission('forms.manage');
  const { id } = await params;
  await db.connect();
  const f = id === 'new' ? null : isId(id) ? await Form.findById(id).lean() : null;
  if (id !== 'new' && !f) notFound();
  const initial = {
    title: f?.title ?? 'Event registration', slug: f?.slug ?? `registration-${Date.now().toString(36)}`, description: f?.description ?? '',
    status: f?.status ?? 'open', successMessage: f?.successMessage ?? 'Thanks — you’re registered. Check your email for details.', submitLabel: f?.submitLabel ?? 'Register',
    uniqueEmail: f?.uniqueEmail ?? true, limit: f?.limit ?? 0, closesAt: local(f?.closesAt), notifyEmail: f?.notifyEmail ?? '',
    fields: f ? (JSON.parse(JSON.stringify(f.fields)) as FormField[]) : STARTER,
  } as const;
  return (
    <>
      <PageHeader eyebrow={<Link href="/admin/forms" className="hover:underline">← Forms</Link>} title={f ? f.title : 'New form'}
        actions={f && can(user, 'submissions.view') ? <Link href={`/admin/forms/${id}/responses`} className="rounded-xl border border-white/12 px-4 py-2.5 text-[13.5px] hover:border-white/25">Responses</Link> : null} />
      <FormBuilder id={f ? String(f._id) : ''} initial={{ ...initial, fields: [...initial.fields] }} action={saveForm} />
    </>
  );
}
