'use server';
// FILE: app/admin/_actions/settings.ts — site settings, logo, theme, security switches
import { z } from 'zod';
import { db } from '@/lib/db';
import { SiteSettings } from '@/lib/models';
import { authorize } from '@/lib/auth/guard';
import { audit } from '@/lib/audit';
import { refreshContent } from '@/lib/content/revalidate';
import { THEME_PRESETS, THEME_TOKENS, isHex } from '@/lib/cms/theme';
import { fail, ok, zodFail, str, bool } from '@/lib/admin/result';
import type { ActionState } from '@/components/admin/ActionForm';

const url = z.union([z.literal(''), z.string().trim().max(500).refine((v) => /^https:\/\//.test(v) || v.startsWith('/'), 'Use https:// or a /path')]);

const general = z.object({
  name: z.string().trim().min(2).max(80),
  shortName: z.string().trim().min(1).max(16),
  email: z.string().trim().email().max(254),
  applyUrl: z.string().trim().url().max(500),
});

export async function saveGeneral(_p: ActionState, fd: FormData): Promise<ActionState> {
  const auth = await authorize('settings.manage'); if (!auth.ok) return fail(auth.error);
  const parsed = general.safeParse({ name: str(fd, 'name'), shortName: str(fd, 'shortName'), email: str(fd, 'email'), applyUrl: str(fd, 'applyUrl') });
  if (!parsed.success) return zodFail(parsed.error);
  await db.connect();
  await SiteSettings.updateOne({}, { $set: parsed.data }, { upsert: true });
  await audit(auth.user, 'settings.general', 'settings');
  refreshContent('site');
  return ok('Settings saved.');
}

const branding = z.object({
  logoUrl: url, logoAlt: z.string().trim().max(120), faviconUrl: url,
  logoDisplayHeight: z.coerce.number().int().min(16).max(120), logoBlend: z.boolean(),
  logoWidth: z.coerce.number().int().min(0).max(5000), logoHeight: z.coerce.number().int().min(0).max(5000),
});

export async function saveBranding(_p: ActionState, fd: FormData): Promise<ActionState> {
  const auth = await authorize('settings.manage'); if (!auth.ok) return fail(auth.error);
  const parsed = branding.safeParse({
    logoUrl: str(fd, 'logoUrl'), logoAlt: str(fd, 'logoAlt'), faviconUrl: str(fd, 'faviconUrl'),
    logoDisplayHeight: fd.get('logoDisplayHeight'), logoBlend: bool(fd, 'logoBlend'), logoWidth: fd.get('logoWidth') || 0, logoHeight: fd.get('logoHeight') || 0,
  });
  if (!parsed.success) return zodFail(parsed.error);
  const d = parsed.data;
  await db.connect();
  await SiteSettings.updateOne({}, { $set: { ...d, logoUrl: d.logoUrl || null, faviconUrl: d.faviconUrl || null, logoWidth: d.logoWidth || null, logoHeight: d.logoHeight || null } }, { upsert: true });
  await audit(auth.user, 'settings.branding', 'settings', { logo: d.logoUrl });
  refreshContent('site');
  return ok('Branding saved.');
}

export async function saveTheme(_p: ActionState, fd: FormData): Promise<ActionState> {
  const auth = await authorize('theme.manage'); if (!auth.ok) return fail(auth.error);
  const preset = str(fd, 'preset', 40);
  if (preset !== 'custom' && !THEME_PRESETS.some((p) => p.id === preset)) return fail('Unknown colour scheme.');
  const colors: Record<string, string> = {};
  for (const k of Object.keys(THEME_TOKENS)) {
    const v = str(fd, `c_${k}`, 7).toLowerCase();
    if (preset === 'custom' && !isHex(v)) return fail(`“${THEME_TOKENS[k as keyof typeof THEME_TOKENS].label}” must be a #rrggbb colour.`);
    if (isHex(v)) colors[k] = v;
  }
  await db.connect();
  await SiteSettings.updateOne({}, { $set: { theme: { preset, colors } } }, { upsert: true });
  await audit(auth.user, 'theme.save', 'settings', { preset });
  refreshContent('theme', 'site');
  return ok('Colour scheme applied to the website.');
}

export async function saveSecuritySettings(_p: ActionState, fd: FormData): Promise<ActionState> {
  const auth = await authorize('security.manage'); if (!auth.ok) return fail(auth.error);
  const parsed = z.object({ blockAfterHoneypotHits: z.coerce.number().int().min(1).max(20), minFormSeconds: z.coerce.number().int().min(0).max(60) })
    .safeParse({ blockAfterHoneypotHits: fd.get('blockAfterHoneypotHits'), minFormSeconds: fd.get('minFormSeconds') });
  if (!parsed.success) return zodFail(parsed.error);
  await db.connect();
  await SiteSettings.updateOne({}, { $set: { security: parsed.data } }, { upsert: true });
  await audit(auth.user, 'security.settings', 'settings', parsed.data);
  return ok('Security settings saved.');
}
