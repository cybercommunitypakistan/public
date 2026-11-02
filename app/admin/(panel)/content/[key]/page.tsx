// FILE: app/admin/(panel)/content/[key]/page.tsx — edit one section
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requirePermission } from '@/lib/auth/guard';
import { db } from '@/lib/db';
import { Section } from '@/lib/models';
import { defaultSections } from '@/lib/content/defaults';
import { parseSection, sectionSchemas, type SectionKey } from '@/lib/content/schemas';
import ActionForm, { SubmitButton } from '@/components/admin/ActionForm';
import ObjectEditor from '@/components/admin/ObjectEditor';
import ConfirmAction from '@/components/admin/ConfirmAction';
import { Card, PageHeader } from '@/components/admin/ui';
import { resetSection, saveSection } from '../../../_actions/content';

export default async function SectionPage({ params }: { params: Promise<{ key: string }> }) {
  await requirePermission('content.manage');
  const { key } = await params;
  if (!(key in sectionSchemas)) notFound();
  const k = key as SectionKey;
  await db.connect();
  const row = await Section.findOne({ key: k }).lean();
  const value = parseSection(k, row?.content, defaultSections[k]);
  const view = k.startsWith('about') ? '/about' : '/';
  return (
    <>
      <PageHeader eyebrow={<Link href="/admin/content" className="hover:underline">← Sections</Link>} title={k} description="Lists: one item per line. Changes go live as soon as you save."
        actions={<><a href={view} target="_blank" className="rounded-xl border border-white/12 px-4 py-2.5 text-[13.5px] hover:border-white/25">View ↗</a>
          <ConfirmAction variant="secondary" confirm="Restore the default text for this section?" action={resetSection.bind(null, k)}>Reset to default</ConfirmAction></>} />
      <Card>
        <ActionForm action={saveSection}>
          <input type="hidden" name="key" value={k} />
          <ObjectEditor initial={JSON.parse(JSON.stringify(value))} template={JSON.parse(JSON.stringify(defaultSections[k]))} />
          <div className="mt-6 border-t border-white/[0.06] pt-5"><SubmitButton>Save section</SubmitButton></div>
        </ActionForm>
      </Card>
    </>
  );
}
