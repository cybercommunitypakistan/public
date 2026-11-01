// =============================================================================
// FILE: app/layout.tsx
// Root layout: fonts, Lenis CSS, smooth scroll, and the global site data
// (settings, menu, socials, footer) loaded from the database once and shared
// with every client component through <SiteProvider>.
// =============================================================================

import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/archivo';
import '@fontsource-variable/inter-tight';
import '@fontsource-variable/jetbrains-mono';
import 'lenis/dist/lenis.css';
import './globals.css';
import SmoothScroll from '@/components/providers/SmoothScroll';
import SiteProvider from '@/components/providers/SiteProvider';
import ScrollIndicator from '@/components/layout/ScrollIndicator';
import SiteFooter from '@/components/footer/SiteFooter';
import { getSiteData } from '@/lib/content/queries';

// Enable static generation with ISR revalidation
export const revalidate = 300; // revalidate every 5 minutes

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteData();
  return {
    title: { default: `${site.name} — Building Pakistan’s cyber defenders`, template: `%s` },
    description: `${site.name} (${site.short}) is a community-driven cyber security learning network. Join free programs or become a ${site.short} Ambassador.`,
  };
}

export const viewport: Viewport = {
  themeColor: '#071a2b',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const site = await getSiteData();

  return (
    <html lang="en">
      <body>
        {/* If JS is off, show the hero UI that GSAP would normally reveal */}
        <noscript>
          <style>{'[data-fx]{visibility:visible!important}'}</style>
        </noscript>
        <SiteProvider value={site}>
          <SmoothScroll>
            {/* Page content sits above the footer and slides up to reveal it */}
            <div className="relative z-10 overflow-hidden rounded-b-[28px] bg-ink shadow-[0_40px_80px_-20px_rgba(0,0,0,.7)] sm:rounded-b-[44px]">
              {children}
            </div>
            <SiteFooter />
            <ScrollIndicator />
          </SmoothScroll>
        </SiteProvider>
      </body>
    </html>
  );
}
