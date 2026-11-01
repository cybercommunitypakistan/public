// =============================================================================
// FILE: lib/content/queries.ts
// Server-side data access for the public site.
//  - Every query is cached (unstable_cache) under a tag from lib/content/tags.
//    Admin saves call revalidateContent(tag) → pages refresh instantly.
//    A 5-minute safety refresh also picks up edits made directly in Supabase.
//  - If no DATABASE_URL is set, or the database errors, the built-in defaults
//    are returned so the site never goes down. Errors are logged, not cached.
// =============================================================================

import 'server-only';
import { unstable_cache } from 'next/cache';
import { db, hasDatabase } from '@/lib/db';
import { defaultAboutData, defaultHomeData, defaultSections, defaultSiteData } from './defaults';
import { fromEvent, fromFaq, fromMenuRows, fromProgram, fromSettingsLogo, fromTeamMember, fromTestimonial } from './mappers';
import { parseSection, type SectionContent, type SectionKey } from './schemas';
import { TAGS } from './tags';
import type { AboutData, HomeData, SiteData } from './types';

const SAFETY_REFRESH = 3600; // seconds (1 hour - reduced from 5 min for better performance)

/** Run a DB loader; on any error log once and return the fallback (not cached). */
async function withFallback<T>(label: string, load: () => Promise<T>, fallback: T): Promise<T> {
  if (!hasDatabase) return fallback;
  try {
    return await load();
  } catch (err) {
    console.error(`[content] ${label}: using defaults —`, err instanceof Error ? err.message : err);
    return fallback;
  }
}

/** Load several sections at once; missing rows / bad JSON fall back per key. */
async function loadSections<K extends SectionKey>(keys: K[]): Promise<{ [P in K]: SectionContent<P> }> {
  const rows = await db.section.findMany({ where: { key: { in: keys } } });
  const byKey = new Map(rows.map((r) => [r.key, r.content]));
  return Object.fromEntries(keys.map((k) => [k, parseSection(k, byKey.get(k), defaultSections[k])])) as {
    [P in K]: SectionContent<P>;
  };
}

// ---------- Site (every page) -------------------------------------------------------

const loadSite = unstable_cache(
  async (): Promise<SiteData> => {
    const [settings, menuRows, socials, footerLinks, sections] = await Promise.all([
      db.siteSettings.findUnique({ where: { id: 1 } }),
      db.menuItem.findMany({ orderBy: { order: 'asc' } }),
      db.socialLink.findMany({ where: { visible: true }, orderBy: { order: 'asc' } }),
      db.footerLink.findMany({ where: { visible: true }, orderBy: { order: 'asc' } }),
      loadSections(['site.menuFeature', 'site.footer']),
    ]);
    const d = defaultSiteData;
    return {
      name: settings?.name ?? d.name,
      short: settings?.shortName ?? d.short,
      email: settings?.email ?? d.email,
      applyUrl: settings?.applyUrl ?? d.applyUrl,
      logo: settings ? fromSettingsLogo(settings) : d.logo,
      // lists fall back to defaults only while the database is not seeded yet
      menu: settings ? fromMenuRows(menuRows) : d.menu,
      socials: settings ? socials.map(({ label, href }) => ({ label, href })) : d.socials,
      menuFeature: sections['site.menuFeature'],
      footer: {
        ...sections['site.footer'],
        nav: settings ? footerLinks.map(({ label, href }) => ({ label, href })) : d.footer.nav,
      },
    };
  },
  ['content:site'],
  { tags: [TAGS.site, TAGS.sections], revalidate: SAFETY_REFRESH },
);

export function getSiteData() {
  return withFallback('site', loadSite, defaultSiteData);
}

// ---------- Home ---------------------------------------------------------------------------

const loadHome = unstable_cache(
  async (): Promise<HomeData> => {
    const [sections, programs, events, testimonials, faqs] = await Promise.all([
      loadSections(['home.hero', 'home.manifesto', 'home.programs', 'home.secureher', 'home.events', 'home.testimonials', 'home.faq']),
      db.program.findMany({ where: { published: true }, orderBy: { order: 'asc' } }),
      db.event.findMany({ where: { published: true }, orderBy: { date: 'asc' } }),
      db.testimonial.findMany({ where: { published: true }, orderBy: { order: 'asc' } }),
      db.faq.findMany({ where: { published: true }, orderBy: { order: 'asc' } }),
    ]);
    return {
      hero: sections['home.hero'],
      manifesto: sections['home.manifesto'],
      programsIntro: sections['home.programs'],
      programs: programs.map(fromProgram),
      secureHer: sections['home.secureher'],
      eventsIntro: sections['home.events'],
      events: events.map(fromEvent),
      testimonialsIntro: sections['home.testimonials'],
      testimonials: testimonials.map(fromTestimonial),
      faqIntro: sections['home.faq'],
      faqs: faqs.map(fromFaq),
    };
  },
  ['content:home'],
  { tags: [TAGS.sections, TAGS.programs, TAGS.events, TAGS.testimonials, TAGS.faqs], revalidate: SAFETY_REFRESH },
);

export function getHomeData() {
  return withFallback('home', loadHome, defaultHomeData);
}

// ---------- About ------------------------------------------------------------------------------

const loadAbout = unstable_cache(
  async (): Promise<AboutData> => {
    const [sections, team] = await Promise.all([
      loadSections(['about.hero', 'about.intro', 'about.team']),
      db.teamMember.findMany({ where: { published: true }, orderBy: { order: 'asc' } }),
    ]);
    return {
      hero: sections['about.hero'],
      intro: sections['about.intro'],
      teamIntro: sections['about.team'],
      team: team.map(fromTeamMember),
    };
  },
  ['content:about'],
  { tags: [TAGS.sections, TAGS.team], revalidate: SAFETY_REFRESH },
);

export function getAboutData() {
  return withFallback('about', loadAbout, defaultAboutData);
}
