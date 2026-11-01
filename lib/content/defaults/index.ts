// =============================================================================
// FILE: lib/content/defaults/index.ts
// All default content in one object + the default value of every section key.
// =============================================================================

import type { SectionContent, SectionKey } from '../schemas';
import type { AboutData, HomeData, SiteData } from '../types';
import * as site from './site';
import * as home from './home';
import * as about from './about';

export const defaultSections: { [K in SectionKey]: SectionContent<K> } = {
  'site.menuFeature': site.menuFeature,
  'site.footer': site.footer,
  'home.hero': home.hero,
  'home.manifesto': home.manifesto,
  'home.programs': home.programsIntro,
  'home.secureher': home.secureHer,
  'home.events': home.eventsIntro,
  'home.testimonials': home.testimonialsIntro,
  'home.faq': home.faqIntro,
  'about.hero': about.aboutHero,
  'about.intro': about.aboutIntro,
  'about.team': about.teamIntro,
};

export const defaultSiteData: SiteData = {
  ...site.settings,
  logo: site.logo,
  menu: site.menu,
  socials: site.socials,
  menuFeature: site.menuFeature,
  footer: { ...site.footer, nav: site.footerLinks },
};

export const defaultHomeData: HomeData = {
  hero: home.hero,
  manifesto: home.manifesto,
  programsIntro: home.programsIntro,
  programs: home.programs,
  secureHer: home.secureHer,
  eventsIntro: home.eventsIntro,
  events: home.events,
  testimonialsIntro: home.testimonialsIntro,
  testimonials: home.testimonials,
  faqIntro: home.faqIntro,
  faqs: home.faqs,
};

export const defaultAboutData: AboutData = {
  hero: about.aboutHero,
  intro: about.aboutIntro,
  teamIntro: about.teamIntro,
  team: about.team,
};

export { site as siteDefaults, home as homeDefaults, about as aboutDefaults };
