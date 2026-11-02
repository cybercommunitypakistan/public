// =============================================================================
// FILE: app/about/page.tsx
// About page — content from the database: hero, Meet the team, intro cards.
// =============================================================================

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import SiteHeader from '@/components/layout/SiteHeader';
import { isSystemPageEnabled } from '@/lib/cms/queries';
import AboutHero from '@/components/about/AboutHero';
import TeamSection from '@/components/team/TeamSection';
import IntroSection from '@/components/sections/IntroSection';
import { getAboutData, getSiteData } from '@/lib/content/queries';

// Enable static generation with ISR revalidation
export const revalidate = 300; // revalidate every 5 minutes

export async function generateMetadata(): Promise<Metadata> {
  const [site, about] = await Promise.all([getSiteData(), getAboutData()]);
  return {
    title: `About — ${site.name}`,
    description: about.hero.mission,
  };
}

export default async function AboutPage() {
  if (!(await isSystemPageEnabled('about'))) notFound();
  const about = await getAboutData();

  return (
    <>
      <SiteHeader />
      <main>
        <AboutHero about={about.hero} />
        <TeamSection intro={about.teamIntro} team={about.team} />
        <IntroSection data={about.intro} />
      </main>
    </>
  );
}
