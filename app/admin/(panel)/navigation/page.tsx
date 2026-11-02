// FILE: app/admin/(panel)/navigation/page.tsx — menu (with dropdowns), socials, footer links
import { requirePermission } from '@/lib/auth/guard';
import { db } from '@/lib/db';
import { FooterLink, MenuItem, SocialLink } from '@/lib/models';
import { fromMenuRows } from '@/lib/content/mappers';
import { defaultSiteData } from '@/lib/content/defaults';
import ActionForm, { SubmitButton } from '@/components/admin/ActionForm';
import ObjectEditor from '@/components/admin/ObjectEditor';
import { Card, PageHeader } from '@/components/admin/ui';
import { saveNavigation } from '../../_actions/navigation';

export const metadata = { title: 'Navigation' };

export default async function NavigationPage() {
  await requirePermission('navigation.manage');
  await db.connect();
  const [rows, socialRows, footerRows] = await Promise.all([MenuItem.find().lean(), SocialLink.find().sort({ order: 1 }).lean(), FooterLink.find().sort({ order: 1 }).lean()]);
  const d = defaultSiteData;
  const menu = rows.length ? fromMenuRows(rows) : d.menu;
  const initial = {
    menu: menu.map((m) => ({ label: m.label, href: m.href ?? '', badge: m.badge ?? '', children: (m.children ?? []).map((c) => ({ label: c.label, href: c.href, description: c.description ?? '', badge: c.badge ?? '' })) })),
    socials: socialRows.length ? socialRows.map(({ label, href }) => ({ label, href })) : d.socials,
    footer: footerRows.length ? footerRows.map(({ label, href }) => ({ label, href })) : d.footer.nav,
  };
  const template = { menu: [{ label: '', href: '', badge: '', children: [{ label: '', href: '', description: '', badge: '' }] }], socials: [{ label: '', href: '' }], footer: [{ label: '', href: '' }] };
  return (
    <>
      <PageHeader eyebrow="Content" title="Navigation" description="Top-level items with a link, or a label with dropdown items (leave Href empty). Pages marked “Show in menu” are added automatically." />
      <Card>
        <ActionForm action={saveNavigation}>
          <ObjectEditor initial={initial} template={template} />
          <div className="mt-6 border-t border-white/[0.06] pt-5"><SubmitButton>Save navigation</SubmitButton></div>
        </ActionForm>
      </Card>
    </>
  );
}
