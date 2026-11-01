// =============================================================================
// FILE: lib/site.ts
// All Cyber Community Pakistan copy & links in one place — edit here, not in
// the components.
// =============================================================================

// ---------- Types -------------------------------------------------------------

/** A link inside a dropdown. */
export type MenuChild = {
  label: string;
  /** '#section' (smooth scroll), '/page' (route), 'https://…' (new tab), 'mailto:…' */
  href: string;
  /** Small line under the label (optional). */
  description?: string;
  /** Small pill next to the label, e.g. 'Open', 'New' (optional). */
  badge?: string;
};

/** A top-level menu item: either a plain link (href) or a dropdown (children). */
export type MenuItem = {
  label: string;
  href?: string;
  badge?: string;
  children?: MenuChild[];
};

/** Optional image logo. Leave `logo: null` to use the built-in text mark. */
export type SiteLogo = {
  /** Path in /public (e.g. '/logo.svg') or a full URL. */
  src: string;
  alt: string;
  /** Intrinsic size of the image file (used for aspect ratio). */
  width: number;
  height: number;
  /** Rendered height in px on desktop (mobile uses ~80%). */
  displayHeight?: number;
  /**
   * true  = logo inverts like the header text (best for a single-colour WHITE logo).
   * false = logo keeps its own colours (for a full-colour logo).
   */
  blend?: boolean;
};

// ---------- Content -----------------------------------------------------------

const logo: SiteLogo | null = {
  src: '/logo.png',
  alt: 'Cyber Community Pakistan',
  width: 320,
  height: 80,
  displayHeight: 64,
  blend: true,
};


const menu: MenuItem[] = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  {
    label: 'Programs',
    children: [
      { label: 'All programs', href: '#programs', description: 'Everything we teach, in one place' },
      { label: 'Cybersecurity 101', href: 'https://forms.gle/6CbWyKP6ZYidyPHg6', description: '12 beginner lectures · starts Sat 24 Oct', badge: 'Open' },
      { label: 'Hands-on Labs', href: '#programs', description: 'Practice safely, step by step' },
      { label: 'Workshops & Webinars', href: '#programs', description: 'Live sessions with practitioners' },
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
  { label: 'SecureHer', href: '#secureher' },
  { label: 'Events', href: '#events' },
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

export const site = {
  name: 'Cyber Community Pakistan',
  short: 'CCP',
  email: 'ambassador@cybercommunity.pk',
  applyUrl: 'https://forms.gle/w83cJ53Vo8kX8hHj8',

  logo,
  menu,

  // TODO: replace '#' with your real profile URLs
  socials: [
    { label: 'LinkedIn', href: '#' },
    { label: 'Instagram', href: '#' },
    { label: 'X', href: '#' },
  ],

  /** Card on the right side of the open menu (desktop) / bottom (mobile). */
  menuFeature: {
    eyebrow: 'Registrations open',
    title: 'Become a CCP Ambassador',
    body: 'Represent Cyber Community Pakistan at your university and help build the next generation of defenders.',
    cta: 'Apply now',
  },

  /** Site footer (all pages) */
  footer: {
    eyebrow: "Let's talk",
    headline: ["Let's secure", 'Pakistan, together.'],
    primaryCta: 'Become an Ambassador',
    emailCta: 'Drop us an email',
    /** Giant ink wordmark at the bottom */
    wordmark: 'CCP',
    location: 'Lahore, Pakistan',
    timeZone: 'Asia/Karachi',
    tagline: 'Made with care in Pakistan',
    nav: [
      { label: 'About', href: '/about' },
      { label: 'Programs', href: '/#programs' },
      { label: 'Events', href: '/#events' },
      { label: 'FAQ', href: '/#faq' },
      { label: 'SecureHer', href: '/#secureher' },
    ],
  },

  /** /about page hero */
  about: {
    eyebrow: 'About us',
    /** Headline lines. `{rotate}` marks where the cycling emerald word goes. */
    headline: ["We don't just teach", 'cyber security.', 'We build {rotate}.'],
    rotatingWords: ['defenders', 'leaders', 'careers', 'communities', 'confidence'],
    mission:
      'Cyber Community Pakistan is a community-driven learning network. We make cyber security simple, free to start and open to everyone — from first-year students to career switchers — through programs, hands-on labs and student ambassadors at universities.',
    primaryCta: 'Join as an Ambassador',
    secondaryCta: { label: 'Our programs', href: '/#programs' },
    pillars: [
      { title: 'Free to start', body: 'Learn the basics without paying a rupee.' },
      { title: 'Simple words', body: 'No jargon walls — every topic explained plainly.' },
      { title: 'Community-led', body: 'Built by learners, ambassadors and mentors.' },
      { title: 'Open to all', body: 'SecureHer helps more women join the field.' },
    ],
    marquee: ['Learn', 'Practice', 'Share', 'Defend', 'Include', 'Lead'],
  },

  hero: {
    /** Wordmark on wide screens — each line is stretched to full width. */
    lines: ['CYBER COMMUNITY', 'PAKISTAN'],
    /** Wordmark on tall / phone screens. */
    compactLines: ['CYBER', 'COMMUNITY', 'PAKISTAN'],
    tagline: ['Not just a skill, a mission.', "Because Pakistan's digital future needs defenders."],
    primaryCta: 'Become an Ambassador',
    secondaryCta: 'Explore programs',
    caption: 'A community-driven cyber security learning network, made in Pakistan.',
    badge: 'Ambassador Program · Registrations open',
    ring: 'APPLY NOW • AMBASSADOR PROGRAM • ',
  },
};