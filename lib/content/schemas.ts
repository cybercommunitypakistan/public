// =============================================================================
// FILE: lib/content/schemas.ts
// Every editable section and its fields. Stored in the `Section` table
// (key → JSON content) and validated with these zod schemas when read and
// when saved from the admin panel. Add a field here + in defaults.ts and it's
// available everywhere.
// =============================================================================

import { z } from 'zod';

const text = z.string().trim();
const lines = z.array(text).min(1);
const link = text; // '#x', '/x', 'https://…', 'mailto:…'

export const sectionSchemas = {
  // ---------- global ----------
  'site.menuFeature': z.object({
    eyebrow: text,
    title: text,
    body: text,
    cta: text,
  }),
  'site.footer': z.object({
    eyebrow: text,
    headline: lines,
    primaryCta: text,
    emailCta: text,
    wordmark: text.min(1).max(20),
    location: text,
    timeZone: text,
    tagline: text,
  }),

  // ---------- home ----------
  'home.hero': z.object({
    /** wordmark lines on wide screens (each stretched to full width) */
    lines,
    /** wordmark lines on phones */
    compactLines: lines,
    tagline: lines,
    primaryCta: text,
    /** empty = Ambassador form (settings.applyUrl) */
    primaryHref: text.default(''),
    secondaryCta: text,
    secondaryHref: link.default('#programs'),
    caption: text,
    badge: text,
    ring: text,
  }),
  'home.manifesto': z.object({
    eyebrow: text,
    /** [shield] [terminal] [people] [lock] [spark] = icon chips, *word* = emerald */
    text: text,
    signature: text,
  }),
  'home.programs': z.object({
    eyebrow: text,
    title: text,
    body: text,
  }),
  'home.secureher': z.object({
    eyebrow: text,
    title: lines,
    lead: text,
    points: z.array(z.object({ title: text, body: text })),
    ctaLabel: text,
    ctaHref: link,
    ring: text,
    chips: z.array(text),
  }),
  'home.events': z.object({
    eyebrow: text,
    title: text,
    body: text,
    /** how many upcoming events to show */
    limit: z.coerce.number().int().min(1).max(20),
    ctaLabel: text,
    ctaHref: link,
  }),
  'home.testimonials': z.object({
    eyebrow: text,
    title: text,
  }),
  'home.faq': z.object({
    eyebrow: text,
    title: lines,
    body: text,
  }),

  // ---------- about ----------
  'about.hero': z.object({
    eyebrow: text,
    /** `{rotate}` marks where the cycling emerald word goes */
    headline: lines,
    rotatingWords: lines,
    mission: text,
    primaryCta: text,
    secondaryCta: z.object({ label: text, href: link }),
    pillars: z.array(z.object({ title: text, body: text })),
    marquee: lines,
  }),
  'about.intro': z.object({
    eyebrow: text,
    statement: text,
    cards: z.array(
      z.object({
        /** element id → link target, e.g. 'ambassadors' for /about#ambassadors */
        anchor: text,
        tag: text,
        title: text,
        body: text,
        ctaLabel: text,
        /** empty = Ambassador form */
        ctaHref: link.default(''),
        highlight: z.boolean().default(false),
      }),
    ),
    contactLabel: text,
  }),
  'about.team': z.object({
    eyebrow: text,
    title: lines,
    body: text,
    groupLabels: z.object({ all: text, core: text, leads: text, advisors: text }),
    join: z.object({ title: text, body: text, cta: text }),
  }),
} as const;

export type SectionKey = keyof typeof sectionSchemas;
export type SectionContent<K extends SectionKey> = z.infer<(typeof sectionSchemas)[K]>;

export const SECTION_KEYS = Object.keys(sectionSchemas) as SectionKey[];

/**
 * Validate stored JSON for a section. Missing/invalid fields fall back to the
 * defaults, so a half-filled row never breaks the page.
 */
export function parseSection<K extends SectionKey>(key: K, value: unknown, fallback: SectionContent<K>): SectionContent<K> {
  const schema = sectionSchemas[key];
  const direct = schema.safeParse(value);
  if (direct.success) return direct.data as SectionContent<K>;
  if (value && typeof value === 'object') {
    const merged = schema.safeParse({ ...fallback, ...(value as object) });
    if (merged.success) return merged.data as SectionContent<K>;
  }
  return fallback;
}
