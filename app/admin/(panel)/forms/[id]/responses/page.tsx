// FILE: app/admin/(panel)/forms/[id]/responses/page.tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requirePermission } from '@/lib/auth/guard';
import { db } from '@/lib/db';
import { Form, Submission } from '@/lib/models';
import { isId } from '@/lib/admin/result';
import Responses from '@/components/admin/Responses';
import { PageHeader } from '@/components/admin/ui';
import type { FormField } from '@/lib/forms/schema';

export default async function FormResponses({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission('submissions.view');
  const { id } = await params;
  if (!isId(id)) notFound();
  await db.connect();
  const form = await Form.findById(id).lean();
  if (!form) notFound();
  const [rows, total] = await Promise.all([Submission.find({ form: id }).sort({ createdAt: -1 }).limit(300).lean(), Submission.countDocuments({ form: id })]);
  return (
    <>
      <PageHeader eyebrow={<Link href={`/admin/forms/${id}`} className="hover:underline">← {form.title}</Link>} title="Responses" />
      <Responses user={user} total={total} fields={JSON.parse(JSON.stringify(form.fields)) as FormField[]} rows={JSON.parse(JSON.stringify(rows))} exportHref={`/api/admin/export?form=${id}`} />
    </>
  );
}
