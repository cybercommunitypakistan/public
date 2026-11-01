// =============================================================================
// FILE: lib/content/defaults/about.ts
// Default /about content (hero, intro cards, team). Seeds the database and
// is the fallback when the database is unreachable.
// =============================================================================

import type { SectionContent } from '../schemas';
import type { TeamMember } from '../types';

export const aboutHero: SectionContent<'about.hero'> = {
  eyebrow: 'About us',
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
};

export const aboutIntro: SectionContent<'about.intro'> = {
  eyebrow: 'About CCP',
  statement:
    "We're building Pakistan's next generation of cyber defenders — through free learning programs, hands-on labs and a nationwide network of student ambassadors.",
  cards: [
    {
      anchor: 'programs',
      tag: '01 — Learn',
      title: 'Programs',
      body: 'Beginner-friendly courses and live sessions on networking, Linux, web security and more — taught in simple words.',
      ctaLabel: 'Explore programs',
      ctaHref: '/#programs',
      highlight: false,
    },
    {
      anchor: 'ambassadors',
      tag: '02 — Lead',
      title: 'Ambassador Program',
      body: 'Represent CCP at your university, run events, grow your network and earn ranks as your community grows.',
      ctaLabel: 'Apply now',
      ctaHref: '', // empty = Ambassador form
      highlight: true,
    },
    {
      anchor: 'secureher',
      tag: '03 — Include',
      title: 'SecureHer',
      body: 'A dedicated track that helps more women start and grow a career in cyber security, with mentors who have been there.',
      ctaLabel: 'Learn more',
      ctaHref: '/#secureher',
      highlight: false,
    },
  ],
  contactLabel: 'Questions about the Ambassador Program?',
};

export const teamIntro: SectionContent<'about.team'> = {
  eyebrow: 'The people behind CCP',
  title: ['Meet the', 'team'],
  body: 'Students, engineers and mentors who give their time so anyone in Pakistan can start learning cyber security.',
  groupLabels: { all: 'All', core: 'Core team', leads: 'Leads', advisors: 'Advisors' },
  join: {
    title: 'Your face here',
    body: "We're always looking for ambassadors, mentors and volunteers.",
    cta: 'Join the team',
  },
};

// ---- PLACEHOLDERS — replace with real people in the admin panel ----
export const team: TeamMember[] = [
  { name: 'Team Member', role: 'Founder & President', group: 'core', city: 'Lahore', links: { linkedin: '#', email: 'ambassador@cybercommunity.pk' } },
  { name: 'Team Member', role: 'Co-founder & Operations', group: 'core', city: 'Islamabad', links: { linkedin: '#', x: '#' } },
  { name: 'Team Member', role: 'Community Lead', group: 'leads', city: 'Karachi', links: { linkedin: '#', github: '#' } },
  { name: 'Team Member', role: 'Ambassador Program Lead', group: 'leads', city: 'Peshawar', links: { linkedin: '#' } },
  { name: 'Team Member', role: 'SecureHer Lead', group: 'leads', city: 'Lahore', links: { linkedin: '#', x: '#' } },
  { name: 'Team Member', role: 'Curriculum & Content Lead', group: 'leads', city: 'Multan', links: { linkedin: '#', github: '#' } },
  { name: 'Team Member', role: 'Technical Advisor', group: 'advisors', city: 'Karachi', links: { linkedin: '#' } },
  { name: 'Team Member', role: 'Industry Advisor', group: 'advisors', city: 'Islamabad', links: { linkedin: '#' } },
];
