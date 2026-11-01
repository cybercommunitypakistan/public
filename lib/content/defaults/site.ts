// =============================================================================
// FILE: lib/content/defaults/site.ts
// Default global content: settings, logo, menu, socials, menu card, footer.
// Seeds the database and is the fallback when it is unreachable.
// =============================================================================

import type { SectionContent } from '../schemas';
import type { LinkItem, MenuItem, SiteLogo } from '../types';

export const settings = {
  name: 'Cyber Community Pakistan',
  short: 'CCP',
  email: 'ambassador@cybercommunity.pk',
  applyUrl: 'https://forms.gle/w83cJ53Vo8kX8hHj8',
};

export const logo: SiteLogo | null = {
  src: '/logo.svg',
  alt: 'Cyber Community Pakistan',
  width: 180,
  height: 40,
  displayHeight: 34,
  blend: true,
};

export const menu: MenuItem[] = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  {
    label: 'Programs',
    children: [
      { label: 'All programs', href: '/#programs', description: 'Everything we teach, in one place' },
      { label: 'Cybersecurity 101', href: 'https://forms.gle/6CbWyKP6ZYidyPHg6', description: '12 beginner lectures · starts Sat 24 Oct', badge: 'Open' },
      { label: 'Hands-on Labs', href: '/#programs', description: 'Practice safely, step by step' },
      { label: 'Workshops & Webinars', href: '/#programs', description: 'Live sessions with practitioners' },
    ],
  },
  {
    label: 'Ambassadors',
    badge: 'Open',
    children: [
      { label: 'About the program', href: '/about#ambassadors', description: 'Lead CCP at your university' },
      { label: 'Ranks & rewards', href: '/about#ambassadors', description: 'Grow your community, grow your rank' },
      { label: 'Apply now', href: 'https://forms.gle/w83cJ53Vo8kX8hHj8', description: 'Registration takes 5 minutes', badge: 'Open' },
    ],
  },
  { label: 'SecureHer', href: '/#secureher' },
  { label: 'Events', href: '/#events' },
  {
    label: 'Contact',
    children: [
      { label: 'Email us', href: 'mailto:ambassador@cybercommunity.pk', description: 'ambassador@cybercommunity.pk' },
      { label: 'FAQ', href: '/#faq', description: 'Quick answers to common questions' },
      // TODO: replace '#' with real URLs
      { label: 'LinkedIn', href: '#' },
      { label: 'Instagram', href: '#' },
    ],
  },
];

// TODO: replace '#' with your real profile URLs
export const socials: LinkItem[] = [
  { label: 'LinkedIn', href: '#' },
  { label: 'Instagram', href: '#' },
  { label: 'X', href: '#' },
];

export const menuFeature: SectionContent<'site.menuFeature'> = {
  eyebrow: 'Registrations open',
  title: 'Become a CCP Ambassador',
  body: 'Represent Cyber Community Pakistan at your university and help build the next generation of defenders.',
  cta: 'Apply now',
};

export const footer: SectionContent<'site.footer'> = {
  eyebrow: "Let's talk",
  headline: ["Let's secure", 'Pakistan, together.'],
  primaryCta: 'Become an Ambassador',
  emailCta: 'Drop us an email',
  wordmark: 'CCP',
  location: 'Lahore, Pakistan',
  timeZone: 'Asia/Karachi',
  tagline: 'Made with care in Pakistan',
};

export const footerLinks: LinkItem[] = [
  { label: 'About', href: '/about' },
  { label: 'Programs', href: '/#programs' },
  { label: 'Events', href: '/#events' },
  { label: 'FAQ', href: '/#faq' },
  { label: 'SecureHer', href: '/#secureher' },
];
