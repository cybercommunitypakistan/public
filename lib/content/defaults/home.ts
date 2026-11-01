// =============================================================================
// FILE: lib/content/defaults/home.ts
// Default home page content. Used to seed the database (prisma/seed.ts) and
// as a fallback when the database is unreachable. Live content is edited in
// the database (admin panel) — not here.
// Items marked TODO are examples: replace them with real info.
// =============================================================================

import type { SectionContent } from '../schemas';
import type { EventItem, FaqItem, Program, Testimonial } from '../types';

export const CS101_FORM = 'https://forms.gle/6CbWyKP6ZYidyPHg6';
export const AMBASSADOR_FORM = 'https://forms.gle/w83cJ53Vo8kX8hHj8';


// ---------- Hero (ink wordmark) --------------------------------------------------
export const hero: SectionContent<'home.hero'> = {
  lines: ['CYBER COMMUNITY', 'PAKISTAN'],
  compactLines: ['CYBER', 'COMMUNITY', 'PAKISTAN'],
  tagline: ['Not just a skill, a mission.', "Because Pakistan's digital future needs defenders."],
  primaryCta: 'Become an Ambassador',
  primaryHref: '', // empty = Ambassador form
  secondaryCta: 'Explore programs',
  secondaryHref: '#programs',
  caption: 'A community-driven cyber security learning network, made in Pakistan.',
  badge: 'Ambassador Program · Registrations open',
  ring: 'APPLY NOW • AMBASSADOR PROGRAM • ',
};

// ---------- 1. Manifesto ------------------------------------------------------
/** `[icon]` tokens become small emerald icon chips inside the sentence.
 *  `*word*` = highlighted in emerald. Icons: shield | terminal | people | lock | spark */
export const manifesto: SectionContent<'home.manifesto'> = {
  eyebrow: 'Our manifesto',
  text:
    'Cyber security should never feel like a *locked* *room.* [shield] So we open the door — free-to-start lessons in *simple* *words,* [terminal] hands-on practice, and a community [people] that grows *defenders* on every campus in Pakistan.',
  signature: '— Cyber Community Pakistan',
};

// ---------- 2. Programs -------------------------------------------------------
export const programsIntro: SectionContent<'home.programs'> = {
  eyebrow: 'Programs',
  title: 'Learn by doing',
  body: 'Start from zero and move step by step. Every program is explained in plain words, with practice built in.',
};

export const programs: Program[] = [
  {
    title: 'Cybersecurity 101',
    level: 'Beginner',
    status: 'Open',
    description: 'A 12-lecture introduction to cyber security — from basic tech words to careers, ethics and the law. No experience needed.',
    meta: ['12 online lectures', '6 weekends', '30–45 min each', 'Starts Sat 24 Oct'],
    cta: { label: 'Register now', href: CS101_FORM },
    art: 'terminal',
    featured: true,
  },
  {
    title: 'Ambassador Program',
    level: 'Leadership',
    status: 'Open',
    description: 'Represent CCP at your university: run sessions, grow a local community and rank up as you lead.',
    meta: ['For university students', 'Ranks & rewards', 'Mentorship'],
    cta: { label: 'Apply now', href: AMBASSADOR_FORM },
    art: 'badge',
  },
  // TODO: confirm the programs below (examples)
  {
    title: 'Hands-on Labs',
    level: 'Beginner → Intermediate',
    status: 'Coming soon',
    description: 'Guided practice in safe environments: spot phishing, harden a device, read network traffic — step by step.',
    meta: ['Self-paced', 'Practice tasks', 'Safe environments'],
    cta: { label: 'Get notified', href: CS101_FORM },
    art: 'lab',
  },
  {
    title: 'Workshops & Webinars',
    level: 'All levels',
    status: 'Always on',
    description: 'Live sessions with practitioners on real topics — careers, CTFs, cloud security and staying safe online.',
    meta: ['Live & online', 'Q&A', 'Recordings'],
    cta: { label: 'See events', href: '#events' },
    art: 'mic',
  },
  {
    title: 'SecureHer',
    level: 'Women in cyber',
    status: 'Open',
    description: 'A dedicated track with mentors and a safe space to help more women start and grow in cyber security.',
    meta: ['Mentorship', 'Community', 'Career support'],
    cta: { label: 'Learn more', href: '#secureher' },
    art: 'shield',
  },
];

// ---------- 5. SecureHer -------------------------------------------------------
export const secureHer: SectionContent<'home.secureher'> = {
  eyebrow: 'SecureHer',
  title: ['Secure', 'Her'],
  lead: 'More women belong in cyber security. SecureHer gives them the mentors, the safe space and the confidence to start — and to stay.',
  points: [
    { title: 'Mentorship', body: 'Learn from women already working in the field.' },
    { title: 'A safe space', body: 'Ask anything. No judgement, no gatekeeping.' },
    { title: 'Career support', body: 'Roadmaps, CV reviews and first-job guidance.' },
  ],
  ctaLabel: 'Join SecureHer',
  ctaHref: AMBASSADOR_FORM, // TODO: SecureHer form link if separate
  ring: 'WOMEN IN CYBER • SECUREHER • ',
  chips: ['Mentorship', 'Safe space', 'Career support', 'Community'],
};

// ---------- 7. Events ------------------------------------------------------------
export const eventsIntro: SectionContent<'home.events'> = {
  eyebrow: 'Events',
  title: 'Upcoming sessions',
  body: 'Live, online and beginner-friendly. Register once for Cybersecurity 101 to join every lecture.',
  /** how many upcoming events to show */
  limit: 5,
  ctaLabel: 'Register for Cybersecurity 101',
  ctaHref: CS101_FORM,
};

const cs101 = (date: string, n: number, title: string, description: string): EventItem => ({
  date,
  title,
  type: 'Lecture',
  series: `Cybersecurity 101 · Lecture ${String(n).padStart(2, '0')}`,
  format: 'Online · 30–45 min',
  description,
  href: CS101_FORM,
});

// Real Cybersecurity 101 schedule. Add workshops/webinars here as they're announced.
export const events: EventItem[] = [
  cs101('2026-10-24', 1, 'Welcome to Cybersecurity', 'What cybersecurity is, why it matters in daily life (WhatsApp, online banking, social media) and the CIA Triad explained with simple examples.'),
  cs101('2026-10-25', 2, 'Basic Tech Words Everyone Must Know', 'Hardware, software, operating systems, networks, servers and the cloud — the simple vocabulary that makes every later lecture easy to follow.'),
  cs101('2026-10-31', 3, 'How the Internet Works (Simply)', 'What happens when you open a website: IP addresses, DNS, routers, URLs and why HTTPS and the padlock matter.'),
  cs101('2026-11-01', 4, 'Threats, Vulnerabilities and Risk', 'The core vocabulary of security: assets, threats, vulnerabilities, exploits and risk — plus who attackers are and what ethical hacking means.'),
  cs101('2026-11-07', 5, 'Malware — Harmful Software', 'Viruses, worms, Trojans, spyware and ransomware: how they spread, warning signs and simple ways to stay protected.'),
  cs101('2026-11-08', 6, 'Social Engineering and Phishing', 'How attackers trick people through emails, SMS and phone calls — local examples, red flags and the stop-verify-report habit.'),
  cs101('2026-11-14', 7, 'Passwords and Account Security', 'Why weak and reused passwords are dangerous, how to create strong passphrases, password managers, 2FA/MFA and data breaches.'),
  cs101('2026-11-15', 8, 'Encryption Made Simple', 'How information is kept secret: plaintext, ciphertext and keys, the Caesar cipher, end-to-end encryption and hashing in one sentence.'),
  cs101('2026-11-21', 9, 'Protecting Devices and Networks', 'Updates and patches, antivirus, firewalls, public Wi-Fi and VPNs, backups and app permissions — everyday habits that keep you safe.'),
  cs101('2026-11-22', 10, 'Domains of Cybersecurity', 'Blue Team and SOC, Red Team and penetration testing, GRC, cloud and application security, digital forensics and incident response.'),
  cs101('2026-11-28', 11, 'Careers, Ethics and the Law', 'Entry-level roles, skills to build, beginner certifications and free platforms, Pakistan\'s cybercrime law (PECA 2016) and ethical practice.'),
  cs101('2026-11-29', 12, 'Revision, Quiz and Next Steps', 'Recap of the whole course, an interactive quiz, your personal cyber-safety checklist and a clear beginner roadmap for what to learn next.'),
];

// ---------- 8. Testimonials ----------------------------------------------------
export const testimonialsIntro: SectionContent<'home.testimonials'> = {
  eyebrow: 'Voices',
  title: 'From our community',
};

// TODO: replace with real quotes (with permission) and remove `placeholder`
export const testimonials: Testimonial[] = [
  { quote: 'I had zero background. The lectures used words I actually understood, and for the first time security felt possible for me.', name: 'Student Name', role: 'BS Computer Science', placeholder: true },
  { quote: 'Running sessions as an ambassador taught me more than any course — leading, explaining, and learning with my campus.', name: 'Ambassador Name', role: 'CCP Ambassador', placeholder: true },
  { quote: 'SecureHer gave me mentors who looked like me. That changed how I see my place in this field.', name: 'Member Name', role: 'SecureHer member', placeholder: true },
  { quote: 'The practicals were short and clear. I now check every link before I click, and so does my family.', name: 'Student Name', role: 'Intermediate student', placeholder: true },
  { quote: 'A friendly community where no question is too basic. That is rare.', name: 'Member Name', role: 'Career switcher', placeholder: true },
];

// ---------- 9. FAQ -------------------------------------------------------------
export const faqIntro: SectionContent<'home.faq'> = {
  eyebrow: 'FAQ',
  title: ['Questions,', 'answered.'],
  body: "Can't find what you need? Write to us and a real person will reply.",
};

// TODO: double-check every answer
export const faqs: FaqItem[] = [
  { q: 'Do I need any experience to join?', a: 'No. Cybersecurity 101 starts from zero and explains every word in plain language. If you can use a phone and the internet, you can start.' },
  { q: 'Who can join Cyber Community Pakistan?', a: 'Anyone in Pakistan who wants to learn — school and university students, career switchers and professionals who want to stay safe online.' },
  { q: 'How are the lectures delivered?', a: 'Online, on weekends. Each lecture is 30–45 minutes, theory first, with an optional short practical at the end.' },
  { q: 'Is it free?', a: 'Our beginner learning is free to start. If a program ever has a fee, it will be stated clearly on its registration form.' },
  { q: 'What does a CCP Ambassador do?', a: 'Ambassadors represent CCP at their university: they run sessions, grow a local community and rank up as their community grows. Applications are open now.' },
  { q: 'What is SecureHer?', a: 'Our initiative to help more women start and grow in cyber security, with mentors, a safe community and career support.' },
];
