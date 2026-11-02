'use server';
// FILE: app/admin/_actions/navigation.ts — menu (with dropdowns), social links, footer links
import { z } from 'zod';
import { db } from '@/lib/db';
import { FooterLink, MenuItem, SocialLink } from '@/lib/models';
import { authorize } from '@/lib/auth/guard';
import { audit } from '@/lib/audit';
import { refreshContent } from '@/lib/content/revalidate';
import { fail, ok, readJson, zodFail } from '@/lib/admin/result';
import type { ActionState } from '@/components/admin/ActionForm';

const href = z.string().trim().max(500).refine((h) => /^(https?:|mailto:|tel:)/i.test(h) || h.startsWith('/') || h.startsWith('#'), 'Links must start with /, #, https://, mailto: or tel:');
const opt = z.string().trim().max(160).default('');
const link = z.object({ label: z.string().trim().min(1).max(60), href });
const schema = z.object({
  menu: z.array(z.object({ label: z.string().trim().min(1).max(60), href: z.union([z.literal(''), href]).default(''), badge: opt, children: z.array(link.extend({ description: opt, badge: opt })).max(20).default([]) })).max(20),
  socials: z.array(link).max(20),
  footer: z.array(link).max(30),
});

export async function saveNavigation(_p: ActionState, fd: FormData): Promise<ActionState> {
  const auth = await authorize('navigation.manage'); if (!auth.ok) return fail(auth.error);
  let data: unknown; try { data = readJson(fd); } catch { return fail('Could not read the form data.'); }
  const parsed = schema.safeParse(data);
  if (!parsed.success) return zodFail(parsed.error);
  const { menu, socials, footer } = parsed.data;
  for (const m of menu) if (!m.href && m.children.length === 0) return fail(`Menu item “${m.label}” needs a link or dropdown items.`);
  await db.connect();
  await MenuItem.deleteMany({});
  for (const [i, m] of menu.entries()) {
    const top = await MenuItem.create({ label: m.label, href: m.children.length ? null : m.href, badge: m.badge || null, order: i, visible: true });
    if (m.children.length) await MenuItem.insertMany(m.children.map((c, j) => ({ label: c.label, href: c.href, description: c.description || null, badge: c.badge || null, order: j, visible: true, parentId: top._id })));
  }
  await SocialLink.deleteMany({}); await SocialLink.insertMany(socials.map((s, i) => ({ ...s, order: i, visible: true })));
  await FooterLink.deleteMany({}); await FooterLink.insertMany(footer.map((s, i) => ({ ...s, order: i, visible: true })));
  await audit(auth.user, 'navigation.save', 'navigation');
  refreshContent('site');
  return ok('Navigation saved.');
}
