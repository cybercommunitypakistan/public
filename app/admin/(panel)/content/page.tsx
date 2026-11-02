// FILE: app/admin/(panel)/content/page.tsx — list of editable sections
import Link from 'next/link';
import { requirePermission } from '@/lib/auth/guard';
import { SECTION_KEYS } from '@/lib/content/schemas';
import { Card, PageHeader } from '@/components/admin/ui';

export const metadata = { title: 'Sections' };

const INFO: Record<string, [string, string]> = {
  'home.hero': ['Home · Hero', 'Big wordmark, tagline, buttons, badge'],
  'home.manifesto': ['Home · Manifesto', 'The statement paragraph'],
  'home.programs': ['Home · Programs intro', 'Heading above the program cards'],
  'home.secureher': ['Home · SecureHer', 'Women in security section'],
  'home.events': ['Home · Events intro', 'Heading + how many events to show'],
  'home.testimonials': ['Home · Testimonials intro', 'Heading above quotes'],
  'home.faq': ['Home · FAQ intro', 'Heading and contact box'],
  'about.hero': ['About · Hero', 'Headline, rotating words, mission'],
  'about.intro': ['About · Intro cards', 'Statement and cards'],
  'about.team': ['About · Team intro', 'Heading and group labels'],
  'site.menuFeature': ['Menu · Feature card', 'Card inside the full-screen menu'],
  'site.footer': ['Footer', 'Headline, wordmark, location, tagline'],
};

export default async function ContentPage() {
  await requirePermission('content.manage');
  const groups = ['home', 'about', 'site'];
  return (
    <>
      <PageHeader eyebrow="Content" title="Sections & hero" description="Every text on the home and about pages. Edit the hero wordmark and tagline under Home · Hero." />
      <div className="grid gap-6 lg:grid-cols-3">
        {groups.map((g) => (
          <Card key={g} title={g === 'site' ? 'Site-wide' : g === 'home' ? 'Home page' : 'About page'} padded={false}>
            <ul className="divide-y divide-white/[0.05]">
              {SECTION_KEYS.filter((k) => k.startsWith(`${g}.`)).map((k) => (
                <li key={k}>
                  <Link href={`/admin/content/${k}`} className="flex items-center justify-between gap-3 px-5 py-3.5 transition hover:bg-white/[0.03]">
                    <span><span className="block text-[13.5px] font-medium">{INFO[k]?.[0] ?? k}</span><span className="text-[12px] text-paper/45">{INFO[k]?.[1]}</span></span>
                    <span className="text-paper/30">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </>
  );
}
