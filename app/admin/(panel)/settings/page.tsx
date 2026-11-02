// FILE: app/admin/(panel)/settings/page.tsx — general + logo/branding
import { requirePermission } from '@/lib/auth/guard';
import { db } from '@/lib/db';
import { SiteSettings } from '@/lib/models';
import { defaultSiteData } from '@/lib/content/defaults';
import ActionForm, { SubmitButton } from '@/components/admin/ActionForm';
import ImageField from '@/components/admin/ImageField';
import { Card, Field, PageHeader, inputCls } from '@/components/admin/ui';
import { saveBranding, saveGeneral } from '../../_actions/settings';

export const metadata = { title: 'Settings' };

export default async function SettingsPage() {
  await requirePermission('settings.manage');
  await db.connect();
  const s = (await SiteSettings.findOne().lean()) ?? null;
  const d = defaultSiteData;
  return (
    <>
      <PageHeader eyebrow="Appearance" title="Settings & logo" description="Site identity used in the header, menu, footer and page titles." />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="General">
          <ActionForm action={saveGeneral} className="grid gap-4">
            <Field label="Organisation name"><input name="name" defaultValue={s?.name ?? d.name} required className={inputCls} /></Field>
            <Field label="Short name" hint="Shown in tight spaces, e.g. CCP"><input name="shortName" defaultValue={s?.shortName ?? d.short} required className={inputCls} /></Field>
            <Field label="Contact email"><input name="email" type="email" defaultValue={s?.email ?? d.email} required className={inputCls} /></Field>
            <Field label="Apply / main CTA link" hint="Used by “Apply now” buttons"><input name="applyUrl" type="url" defaultValue={s?.applyUrl ?? d.applyUrl} required className={inputCls} /></Field>
            <div><SubmitButton>Save settings</SubmitButton></div>
          </ActionForm>
        </Card>
        <Card title="Logo & favicon" description="Leave the logo empty to use the built-in text mark.">
          <ActionForm action={saveBranding} className="grid gap-4">
            <Field label="Logo"><ImageField name="logoUrl" defaultValue={s?.logoUrl ?? ''} /></Field>
            <Field label="Logo alt text"><input name="logoAlt" defaultValue={s?.logoAlt ?? ''} className={inputCls} placeholder={s?.name ?? d.name} /></Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Display height (px)"><input name="logoDisplayHeight" type="number" min={16} max={120} defaultValue={s?.logoDisplayHeight ?? 34} className={inputCls} /></Field>
              <Field label="Image width"><input name="logoWidth" type="number" defaultValue={s?.logoWidth ?? ''} className={inputCls} /></Field>
              <Field label="Image height"><input name="logoHeight" type="number" defaultValue={s?.logoHeight ?? ''} className={inputCls} /></Field>
            </div>
            <label className="flex items-center gap-3 text-[13.5px] text-paper/75">
              <input type="checkbox" name="logoBlend" defaultChecked={s?.logoBlend ?? true} className="size-4 accent-[var(--color-emerald)]" />
              Blend with the header (best for single-colour white logos)
            </label>
            <Field label="Favicon"><ImageField name="faviconUrl" defaultValue={s?.faviconUrl ?? ''} /></Field>
            <div><SubmitButton>Save branding</SubmitButton></div>
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
