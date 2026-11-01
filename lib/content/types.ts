// =============================================================================
// FILE: lib/content/types.ts
// The shapes the UI components use. Database rows are mapped into these
// (lib/content/mappers.ts) so components never touch Prisma types.
// =============================================================================

import type { SectionContent } from './schemas';

// ---------- Navigation ---------------------------------------------------------

/** A link inside a dropdown. */
export type MenuChild = {
  label: string;
  /** '#section', '/page', '/page#section', 'https://…' (new tab), 'mailto:…' */
  href: string;
  description?: string;
  badge?: string;
};

/** A top-level menu item: a plain link (href) or a dropdown (children). */
export type MenuItem = {
  label: string;
  href?: string;
  badge?: string;
  children?: MenuChild[];
};

export type LinkItem = { label: string; href: string };

/** Optional image logo. `null` = built-in text mark. */
export type SiteLogo = {
  src: string;
  alt: string;
  width: number;
  height: number;
  displayHeight?: number;
  /** true = inverts like the header text (white logos); false = keep colours */
  blend?: boolean;
};

/** Everything shared by every page (header, menu, footer). */
export type SiteData = {
  name: string;
  short: string;
  email: string;
  applyUrl: string;
  logo: SiteLogo | null;
  menu: MenuItem[];
  socials: LinkItem[];
  menuFeature: SectionContent<'site.menuFeature'>;
  footer: SectionContent<'site.footer'> & { nav: LinkItem[] };
};

// ---------- Home -----------------------------------------------------------------

export type ProgramStatusLabel = 'Open' | 'Coming soon' | 'Always on';
export type ProgramArtName = 'terminal' | 'lab' | 'mic' | 'badge' | 'shield';

export type Program = {
  id?: string;
  title: string;
  level: string;
  status: ProgramStatusLabel;
  description: string;
  meta: string[];
  cta: { label: string; href: string };
  art: ProgramArtName;
  featured?: boolean;
};

export type EventTypeLabel = 'Lecture' | 'Workshop' | 'Webinar' | 'Meetup';

export type EventItem = {
  id?: string;
  /** yyyy-mm-dd (Pakistan calendar day) */
  date: string;
  title: string;
  type: EventTypeLabel;
  series?: string;
  format: string;
  description: string;
  href: string;
};

export type Testimonial = {
  id?: string;
  quote: string;
  name: string;
  role: string;
  avatarUrl?: string;
  placeholder?: boolean;
};

export type FaqItem = { id?: string; q: string; a: string };

export type HomeData = {
  hero: SectionContent<'home.hero'>;
  manifesto: SectionContent<'home.manifesto'>;
  programsIntro: SectionContent<'home.programs'>;
  programs: Program[];
  secureHer: SectionContent<'home.secureher'>;
  eventsIntro: SectionContent<'home.events'>;
  events: EventItem[];
  testimonialsIntro: SectionContent<'home.testimonials'>;
  testimonials: Testimonial[];
  faqIntro: SectionContent<'home.faq'>;
  faqs: FaqItem[];
};

// ---------- About ------------------------------------------------------------------

export type TeamGroupId = 'core' | 'leads' | 'advisors';

export type TeamMember = {
  id?: string;
  name: string;
  role: string;
  group: TeamGroupId;
  city?: string;
  photo?: string;
  links?: { linkedin?: string; x?: string; github?: string; email?: string };
};

export type AboutData = {
  hero: SectionContent<'about.hero'>;
  intro: SectionContent<'about.intro'>;
  teamIntro: SectionContent<'about.team'>;
  team: TeamMember[];
};
