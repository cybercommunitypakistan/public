'use server';
// FILE: app/admin/_actions/pages.ts — create / edit / publish / disable / delete pages
import { z } from 'zod';
import { db } from '@/lib/db';
import { Page } from '@/lib/models';
import { authorize } from '@/lib/auth/guard';
import { audit } from '@/lib/audit';
import { refreshContent } from '@/lib/content/revalidate';
import { parseBlocks } from '@/lib/blocks/registry';
import { PAGE_SLUG, isReservedSlug, slugify } from '@/lib/cms/slug';
import { bool, fail, isId, ok, readJson, str, zodFail } from '@/lib/admin/result';
import type { ActionState } from '@/components/admin/ActionForm';

const meta = z.object({
  title: z.string().trim().min(2).max(140),
  slug: z.string().trim().toLowerCase(),
  description: z.string().trim().max(300),
  status: z.enum(['published', 'draft', 'disabled']),
  showInMenu: z.boolean(),
  menuLabel: z.string().trim().max(40),
  order: z.coerce.number().int().min(0).max(9999),
  ogImage: z.string().trim().max(500),
});

export async function savePage(_p: ActionState, fd: FormData): Promise<ActionState> {
  const auth = await authorize('pages.edit'); if (!auth.ok) return fail(auth.error);
  const id = str(fd, 'id', 24);
  const parsed = meta.safeParse({
    title: str(fd, 'title'), slug: slugify(str(fd, 'slug') || str(fd, 'title'), 120), description: str(fd, 'description'),
    status: str(fd, 'status') || 'draft', showInMenu: bool(fd, 'showInMenu'), menuLabel: str(fd, 'menuLabel'), order: fd.get('order') || 100, ogImage: str(fd, 'ogImage'),
  });
  if (!parsed.success) return zodFail(parsed.error);
  const d = parsed.data;
  await db.connect();
  const existing = isId(id) ? await Page.findById(id).lean() : null;
  if (isId(id) && !existing) return fail('Page not found.');

  // only publishers may publish / disable
  if (!auth.user.permissions.includes('pages.publish') && d.status !== (existing?.status ?? 'draft')) return fail('You can save drafts; an editor with publish rights must publish it.');

  if (existing?.system) {
    await Page.updateOne({ _id: existing._id }, { $set: { status: d.status, showInMenu: d.showInMenu, menuLabel: d.menuLabel, order: d.order, updatedBy: auth.user.id } });
    await audit(auth.user, 'page.system', `page:${existing.slug || 'home'}`, { status: d.status });
    refreshContent('pages', 'site');
    return ok(d.status === 'published' ? 'Page enabled.' : 'Page disabled — it now returns 404.');
  }

  if (!PAGE_SLUG.test(d.slug)) return fail('URL must be lowercase words separated by dashes (e.g. join-us or programs/cs101).', { slug: 'Invalid URL' });
  if (isReservedSlug(d.slug)) return fail(`“/${d.slug}” is reserved by the site.`, { slug: 'Reserved' });
  if (await Page.exists({ slug: d.slug, _id: { $ne: existing?._id } })) return fail(`Another page already uses /${d.slug}.`, { slug: 'Taken' });

  let blocks;
  try { blocks = parseBlocks(readJson(fd, 'blocks')); } catch (e) { return fail(e instanceof Error ? e.message : 'Invalid blocks'); }

  const doc = { ...d, ogImage: d.ogImage || null, blocks, updatedBy: auth.user.id };
  if (existing) {
    await Page.updateOne({ _id: existing._id }, { $set: doc });
    await audit(auth.user, 'page.update', `page:${d.slug}`, { status: d.status });
    refreshContent('pages', 'site');
    return ok(d.status === 'published' ? `Saved — live at /${d.slug}` : 'Saved.');
  }
  const created = await Page.create({ ...doc, system: false });
  await audit(auth.user, 'page.create', `page:${d.slug}`);
  refreshContent('pages', 'site');
  return ok('Page created.', `/admin/pages/${created._id}`);
}

export async function setPageStatus(id: string, status: 'published' | 'draft' | 'disabled') {
  const auth = await authorize('pages.publish'); if (!auth.ok) return fail(auth.error);
  if (!isId(id) || !['published', 'draft', 'disabled'].includes(status)) return fail('Invalid request.');
  await db.connect();
  const p = await Page.findByIdAndUpdate(id, { $set: { status, updatedBy: auth.user.id } }).lean();
  if (!p) return fail('Page not found.');
  await audit(auth.user, 'page.status', `page:${p.slug || 'home'}`, { status });
  refreshContent('pages', 'site');
  return ok();
}

export async function deletePage(id: string) {
  const auth = await authorize('pages.publish'); if (!auth.ok) return fail(auth.error);
  if (!isId(id)) return fail('Invalid request.');
  await db.connect();
  const p = await Page.findById(id).lean();
  if (!p) return fail('Page not found.');
  if (p.system) return fail('Built-in pages can be disabled but not deleted.');
  await Page.deleteOne({ _id: id });
  await audit(auth.user, 'page.delete', `page:${p.slug}`);
  refreshContent('pages', 'site');
  return ok('Page deleted.');
}
