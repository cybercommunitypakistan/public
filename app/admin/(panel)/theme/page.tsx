// FILE: app/admin/(panel)/theme/page.tsx
import { requirePermission } from '@/lib/auth/guard';
import { db } from '@/lib/db';
import { SiteSettings } from '@/lib/models';
import { THEME_PRESETS, resolveTheme } from '@/lib/cms/theme';
import { PageHeader } from '@/components/admin/ui';
import ThemeEditor from './ThemeEditor';

export const metadata = { title: 'Colour scheme' };

export default async function ThemePage() {
  await requirePermission('theme.manage');
  await db.connect();
  const t = (await SiteSettings.findOne().select('theme').lean())?.theme;
  return (
    <>
      <PageHeader eyebrow="Appearance" title="Colour scheme" description="Pick a preset or mix your own. Changes apply to the whole public website instantly." />
      <ThemeEditor presets={THEME_PRESETS} current={{ preset: t?.preset ?? 'midnight-emerald', colors: resolveTheme(t) }} />
    </>
  );
}
