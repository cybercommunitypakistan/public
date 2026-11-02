// =============================================================================
// FILE: lib/blocks/registry.ts
// Page-builder blocks: label, default data (also the editor's field template)
// and the zod schema used to validate what the admin panel saves.
// Add a block: add it here + a renderer in components/blocks/BlockRenderer.tsx.
// =============================================================================
import { z } from 'zod';

const t = (max = 300) => z.string().trim().max(max).default('');
const href = z.string().trim().max(500).default('');

export const BLOCKS = {
  hero: {
    label: 'Hero', description: 'Big headline with buttons',
    schema: z.object({ eyebrow: t(80), title: t(160), body: t(600), primaryLabel: t(40), primaryHref: href, secondaryLabel: t(40), secondaryHref: href, image: href }),
    defaults: { eyebrow: 'Cyber Community Pakistan', title: 'A bold new page', body: 'One or two sentences that tell people why they are here.', primaryLabel: 'Get started', primaryHref: '/events', secondaryLabel: '', secondaryHref: '', image: '' },
  },
  richText: {
    label: 'Text', description: 'Markdown: headings, lists, links, quotes, tables',
    schema: z.object({ markdown: z.string().max(50_000).default('') }),
    defaults: { markdown: '## A heading\n\nWrite **anything** here. Lists, [links](/blog), quotes and tables work.' },
  },
  image: {
    label: 'Image', description: 'A picture with caption',
    schema: z.object({ src: href, alt: t(200), caption: t(300), wide: z.boolean().default(false) }),
    defaults: { src: '', alt: '', caption: '', wide: false },
  },
  cards: {
    label: 'Cards', description: 'Grid of cards (features, programs, links)',
    schema: z.object({ eyebrow: t(80), title: t(160), items: z.array(z.object({ tag: t(40), title: t(120), body: t(500), href })).max(24).default([]) }),
    defaults: { eyebrow: 'What you get', title: 'Three good reasons', items: [{ tag: '01', title: 'Hands-on', body: 'Real labs, not slides.', href: '' }, { tag: '02', title: 'Free', body: 'Community-run and open to all.', href: '' }, { tag: '03', title: 'Mentors', body: 'Learn from people who do it daily.', href: '' }] },
  },
  stats: {
    label: 'Stats', description: 'Big numbers',
    schema: z.object({ items: z.array(z.object({ value: t(20), label: t(80) })).max(8).default([]) }),
    defaults: { items: [{ value: '5,000+', label: 'learners' }, { value: '40+', label: 'sessions' }, { value: '12', label: 'cities' }] },
  },
  cta: {
    label: 'Call to action', description: 'Highlighted banner with one button',
    schema: z.object({ title: t(160), body: t(400), label: t(40), href }),
    defaults: { title: 'Ready to start?', body: 'Join the next cohort — it’s free.', label: 'Apply now', href: '/events' },
  },
  faq: {
    label: 'FAQ', description: 'Questions and answers',
    schema: z.object({ title: t(120), items: z.array(z.object({ q: t(200), a: t(1500) })).max(40).default([]) }),
    defaults: { title: 'Questions', items: [{ q: 'Is it free?', a: 'Yes.' }] },
  },
  events: {
    label: 'Upcoming events', description: 'Next events from the events list',
    schema: z.object({ title: t(120), limit: z.coerce.number().int().min(1).max(24).default(3) }),
    defaults: { title: 'Upcoming events', limit: 3 },
  },
  posts: {
    label: 'Latest posts', description: 'Latest blog posts',
    schema: z.object({ title: t(120), limit: z.coerce.number().int().min(1).max(24).default(3), tag: t(40) }),
    defaults: { title: 'From the blog', limit: 3, tag: '' },
  },
  form: {
    label: 'Form', description: 'Embed a form from Forms',
    schema: z.object({ formSlug: t(120), title: t(160) }),
    defaults: { formSlug: '', title: '' },
  },
  video: {
    label: 'Video', description: 'YouTube video (privacy-enhanced)',
    schema: z.object({ youtubeId: z.string().trim().regex(/^[A-Za-z0-9_-]{0,20}$/).default(''), title: t(160) }),
    defaults: { youtubeId: '', title: '' },
  },
} as const;

export type BlockType = keyof typeof BLOCKS;
export const BLOCK_TYPES = Object.keys(BLOCKS) as BlockType[];
export const isBlockType = (t: string): t is BlockType => t in BLOCKS;
export type BlockData<T extends BlockType> = z.infer<(typeof BLOCKS)[T]['schema']>;

export function parseBlocks(input: unknown): { id: string; type: BlockType; data: Record<string, unknown> }[] {
  if (!Array.isArray(input)) throw new Error('Blocks must be a list');
  if (input.length > 60) throw new Error('A page can have at most 60 blocks');
  return input.map((b, i) => {
    const type = String(b?.type ?? '');
    if (!isBlockType(type)) throw new Error(`Block ${i + 1}: unknown type “${type}”`);
    const parsed = BLOCKS[type].schema.safeParse(b?.data ?? {});
    if (!parsed.success) throw new Error(`Block ${i + 1} (${BLOCKS[type].label}): ${parsed.error.issues[0]?.message}`);
    const id = /^[a-z0-9-]{4,40}$/i.test(String(b?.id)) ? String(b.id) : crypto.randomUUID();
    return { id, type, data: parsed.data as Record<string, unknown> };
  });
}
