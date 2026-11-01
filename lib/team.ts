// =============================================================================
// FILE: lib/team.ts
// Team data for the "Meet the team" section (/about).
// TODO: replace the placeholder entries with your real team.
//  - photo: put images in /public/team/ (e.g. '/team/ali.jpg'), portrait ~4:5.
//    Leave it out to get an auto-generated avatar with initials.
//  - group: must match one of `teamGroups` ids (used by the filter tabs).
//  - links: any you leave out are simply not shown.
// =============================================================================

export type TeamGroup = 'core' | 'leads' | 'advisors';

export type TeamMember = {
  name: string;
  role: string;
  group: TeamGroup;
  city?: string;
  photo?: string;
  links?: { linkedin?: string; x?: string; github?: string; email?: string };
};

export const teamGroups: { id: 'all' | TeamGroup; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'core', label: 'Core team' },
  { id: 'leads', label: 'Leads' },
  { id: 'advisors', label: 'Advisors' },
];

export const teamIntro = {
  eyebrow: 'The people behind CCP',
  title: ['Meet the', 'team'],
  body: 'Students, engineers and mentors who give their time so anyone in Pakistan can start learning cyber security.',
  join: {
    title: 'Your face here',
    body: "We're always looking for ambassadors, mentors and volunteers.",
    cta: 'Join the team',
  },
};

// ---- PLACEHOLDERS — replace with real people ----
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