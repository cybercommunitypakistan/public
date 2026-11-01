// =============================================================================
// FILE: app/page.tsx
// Home page — content comes from the database (lib/content/queries.ts):
//   Ink hero → Manifesto → Programs (horizontal) → SecureHer → Events →
//   Testimonials → FAQ → (footer from app/layout.tsx)
// =============================================================================

import dynamic from 'next/dynamic';
import SiteHeader from '@/components/layout/SiteHeader';
import CyberHero from '@/components/hero/CyberHero';
import Manifesto from '@/components/home/Manifesto';
import Programs from '@/components/home/Programs';
import SecureHer from '@/components/home/SecureHer';
import Events from '@/components/home/Events';
import { getHomeData } from '@/lib/content/queries';

// Lazy load below-the-fold sections for better initial page load
const Testimonials = dynamic(() => import('@/components/home/Testimonials'), {
  loading: () => <div className="min-h-screen bg-navy" />,
});
const FAQ = dynamic(() => import('@/components/home/FAQ'), {
  loading: () => <div className="min-h-[60vh] bg-ink" />,
});

// Enable static generation with ISR revalidation
export const revalidate = 300; // revalidate every 5 minutes

export default async function Home() {
  const home = await getHomeData();

  return (
    <>
      <SiteHeader />
      <main>
        <CyberHero hero={home.hero} />
        <Manifesto manifesto={home.manifesto} />
        {home.programs.length > 0 && <Programs intro={home.programsIntro} programs={home.programs} />}
        <SecureHer secureHer={home.secureHer} />
        <Events intro={home.eventsIntro} events={home.events} />
        {home.testimonials.length > 0 && <Testimonials intro={home.testimonialsIntro} testimonials={home.testimonials} />}
        {home.faqs.length > 0 && <FAQ intro={home.faqIntro} faqs={home.faqs} />}
      </main>
    </>
  );
}
