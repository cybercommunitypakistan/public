'use server';
// FILE: app/admin/_actions/content.ts — save a home/about/site section (hero text etc.)
import { db } from '@/lib/db';
import { Section } from '@/lib/models';
import { authorize } from '@/lib/auth/guard';
import { audit } from '@/lib/audit';
import { refreshContent } from '@/lib/content/revalidate';
import { sectionSchemas, type SectionKey } from '@/lib/content/schemas';
import { defaultSections } from '@/lib/content/defaults';
import { fail, ok, readJson, zodFail } from '@/lib/admin/result';
import type { ActionState } from '@/components/admin/ActionForm';

export async function saveSection(_p: ActionState, fd: FormData): Promise<ActionState> {
  const auth = await authorize('content.manage'); if (!auth.ok) return fail(auth.error);
  const key = String(fd.get('key')) as SectionKey;
  if (!(key in sectionSchemas)) return fail('Unknown section.');
  let data: unknown;
  try { data = readJson(fd); } catch { return fail('Could not read the form data.'); }
  const parsed = sectionSchemas[key].safeParse(data);
  if (!parsed.success) return zodFail(parsed.error);
  await db.connect();
  await Section.updateOne({ key }, { $set: { content: parsed.data } }, { upsert: true });
  await audit(auth.user, 'section.save', `section:${key}`);
  refreshContent('sections', 'site');
  return ok('Section saved — live on the site.');
}

export async function resetSection(key: string) {
  const auth = await authorize('content.manage'); if (!auth.ok) return fail(auth.error);
  if (!(key in defaultSections)) return fail('Unknown section.');
  await db.connect();
  await Section.updateOne({ key }, { $set: { content: defaultSections[key as SectionKey] } }, { upsert: true });
  await audit(auth.user, 'section.reset', `section:${key}`);
  refreshContent('sections', 'site');
  return ok('Restored the default text.');
}
