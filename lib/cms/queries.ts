// =============================================================================
// FILE: lib/cms/queries.ts
// Cached public reads for pages, blog, events and forms. Results are plain
// JSON (ids as strings) so they are safe to cache and pass to client components.
// Admin saves call refreshContent('pages' | 'posts' | 'events' | 'forms').
// =============================================================================
import 'server-only';
import { unstable_cache } from 'next/cache';
import { db, hasDatabase } from '@/lib/db';
import { Event, Form, Page, Post, Submission, SiteSettings, User } from '@/lib/models';
import { TAGS } from '@/lib/content/tags';
import { resolveTheme, type ThemeColors } from './theme';
import type { FormField } from '@/lib/forms/schema';

const REFRESH = 300;

async function safe<T>(label: string, fn: () => Promise<T>, fallback: T): Promise<T> {
  if (!hasDatabase) return fallback;
  try {
    await db.connect();
    return await fn();
  } catch (e) {
    console.error(`[cms] ${label}:`, e instanceof Error ? e.message : e);
    return fallback;
  }
}
const iso = (d?: Date | null) => (d ? new Date(d).toISOString() : null);

// ---------- theme ----------------------------------------------------------------
const loadTheme = unstable_cache(
  async () => resolveTheme((await SiteSettings.findOne().select('theme').lean())?.theme),
  ['cms:theme'], { tags: [TAGS.theme, TAGS.site], revalidate: REFRESH },
);
export const getTheme = () => safe<ThemeColors>('theme', loadTheme, resolveTheme(null));

// ---------- pages ----------------------------------------------------------------
export type PublicPage = { slug: string; title: string; description: string; ogImage: string | null; blocks: { id: string; type: string; data: Record<string, unknown> }[] };

const loadPage = unstable_cache(
  async (slug: string): Promise<PublicPage | null> => {
    const p = await Page.findOne({ slug, status: 'published', system: false }).lean();
    if (!p) return null;
    return { slug: p.slug, title: p.title, description: p.description, ogImage: p.ogImage, blocks: JSON.parse(JSON.stringify(p.blocks)) };
  },
  ['cms:page'], { tags: [TAGS.pages], revalidate: REFRESH },
);
export const getPublishedPage = (slug: string) => safe('page', () => loadPage(slug), null);

const loadSystemStatus = unstable_cache(
  async () => Object.fromEntries((await Page.find({ system: true }).select('slug status').lean()).map((p) => [p.slug, p.status])),
  ['cms:system-pages'], { tags: [TAGS.pages], revalidate: REFRESH },
);
/** false when a code page (home/about/blog/events) is disabled in the admin panel */
export async function isSystemPageEnabled(slug: string) {
  const map = await safe<Record<string, string>>('system-pages', loadSystemStatus, {});
  return (map[slug] ?? 'published') === 'published';
}

const loadSitemapPages = unstable_cache(
  async () => (await Page.find({ status: 'published' }).select('slug updatedAt system').lean()).map((p) => ({ slug: p.slug, updatedAt: iso(p.updatedAt)! })),
  ['cms:sitemap-pages'], { tags: [TAGS.pages], revalidate: REFRESH },
);
export const getSitemapPages = () => safe('sitemap', loadSitemapPages, []);

// ---------- blog -----------------------------------------------------------------
export type PostCard = { slug: string; title: string; excerpt: string; coverUrl: string | null; coverAlt: string; tags: string[]; publishedAt: string; readingMinutes: number; author: string; featured: boolean };
export type PostFull = PostCard & { content: string; seoTitle: string; seoDescription: string; updatedAt: string };

const PAGE_SIZE = 9;

const loadPosts = unstable_cache(
  async (page: number, tag: string) => {
    const q = { status: 'published' as const, publishedAt: { $lte: new Date() }, ...(tag ? { tags: tag } : {}) };
    const [rows, total, tags] = await Promise.all([
      Post.find(q).sort({ featured: -1, publishedAt: -1 }).skip((page - 1) * PAGE_SIZE).limit(PAGE_SIZE).populate('author', 'name').lean(),
      Post.countDocuments(q),
      Post.distinct('tags', { status: 'published', publishedAt: { $lte: new Date() } }),
    ]);
    return {
      posts: rows.map((p) => toCard(p)),
      pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
      tags: (tags as string[]).sort(),
    };
  },
  ['cms:posts'], { tags: [TAGS.posts], revalidate: REFRESH },
);
export const getPosts = (page = 1, tag = '') => safe('posts', () => loadPosts(page, tag), { posts: [], pages: 1, tags: [] as string[] });

const loadPost = unstable_cache(
  async (slug: string): Promise<PostFull | null> => {
    const p = await Post.findOne({ slug, status: 'published', publishedAt: { $lte: new Date() } }).populate('author', 'name').lean();
    if (!p) return null;
    return { ...toCard(p), content: p.content, seoTitle: p.seoTitle, seoDescription: p.seoDescription, updatedAt: iso(p.updatedAt)! };
  },
  ['cms:post'], { tags: [TAGS.posts], revalidate: REFRESH },
);
export const getPost = (slug: string) => safe('post', () => loadPost(slug), null);

function toCard(p: any): PostCard {
  return {
    slug: p.slug, title: p.title, excerpt: p.excerpt, coverUrl: p.coverUrl, coverAlt: p.coverAlt || p.title, tags: p.tags,
    publishedAt: iso(p.publishedAt) ?? iso(p.createdAt)!, readingMinutes: p.readingMinutes, author: p.author?.name ?? 'CCP', featured: p.featured,
  };
}

// ---------- events ---------------------------------------------------------------
export type PublicEvent = {
  id: string; slug: string; title: string; type: string; series: string | null; format: string; description: string;
  date: string; endDate: string | null; startTime: string; endTime: string; location: string; coverUrl: string | null; body: string;
  registration: 'none' | 'form' | 'external'; href: string; formSlug: string | null; capacity: number; closesAt: string | null; waitlist: boolean;
};

function toEvent(e: any, formSlug: string | null): PublicEvent {
  return {
    id: String(e._id), slug: e.slug ?? String(e._id), title: e.title, type: e.type, series: e.series ?? null, format: e.format, description: e.description,
    date: iso(e.date)!.slice(0, 10), endDate: iso(e.endDate)?.slice(0, 10) ?? null, startTime: e.startTime ?? '', endTime: e.endTime ?? '',
    location: e.location ?? '', coverUrl: e.coverUrl ?? null, body: e.body ?? '', registration: e.registration ?? 'external', href: e.href ?? '',
    formSlug, capacity: e.capacity ?? 0, closesAt: iso(e.registrationClosesAt), waitlist: Boolean(e.waitlist),
  };
}

const loadEvents = unstable_cache(
  async () => {
    const rows = await Event.find({ published: true }).sort({ date: 1 }).populate('form', 'slug').lean();
    return rows.map((e: any) => toEvent(e, e.form?.slug ?? null));
  },
  ['cms:events'], { tags: [TAGS.events], revalidate: REFRESH },
);
export const getEvents = () => safe('events', loadEvents, [] as PublicEvent[]);

const loadEvent = unstable_cache(
  async (slug: string) => {
    const e: any = await Event.findOne({ slug, published: true }).populate('form', 'slug').lean();
    return e ? toEvent(e, e.form?.slug ?? null) : null;
  },
  ['cms:event'], { tags: [TAGS.events], revalidate: REFRESH },
);
export const getEvent = (slug: string) => safe('event', () => loadEvent(slug), null);

/** live (uncached) seats count */
export async function getEventSeats(eventId: string) {
  return safe('seats', async () => Submission.countDocuments({ event: eventId, status: { $in: ['new', 'confirmed'] } }), 0);
}

// ---------- forms ----------------------------------------------------------------
export type PublicForm = { id: string; slug: string; title: string; description: string; fields: FormField[]; submitLabel: string; open: boolean; closedReason: string };

export async function getPublicForm(slug: string): Promise<PublicForm | null> {
  return safe('form', async () => {
    const f = await Form.findOne({ slug }).lean();
    if (!f) return null;
    let closedReason = '';
    if (f.status !== 'open') closedReason = 'This form is closed.';
    else if (f.closesAt && f.closesAt.getTime() < Date.now()) closedReason = 'This form is no longer accepting responses.';
    else if (f.limit > 0 && (await Submission.countDocuments({ form: f._id, status: { $ne: 'cancelled' } })) >= f.limit) closedReason = 'All places have been filled.';
    return {
      id: String(f._id), slug: f.slug, title: f.title, description: f.description, submitLabel: f.submitLabel,
      fields: JSON.parse(JSON.stringify(f.fields)), open: !closedReason, closedReason,
    };
  }, null);
}

export async function authorName(id: string) {
  return safe('author', async () => (await User.findById(id).select('name').lean())?.name ?? '', '');
}
