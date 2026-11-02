// FILE: app/sitemap.ts — pages, posts and events from the database
import type { MetadataRoute } from 'next';
import { getEvents, getPosts, getSitemapPages } from '@/lib/cms/queries';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const [pages, events] = await Promise.all([getSitemapPages(), getEvents()]);
  const posts = [];
  for (let p = 1; p <= 20; p++) {
    const r = await getPosts(p);
    posts.push(...r.posts);
    if (p >= r.pages) break;
  }
  return [
    ...pages.map((p) => ({ url: `${base}/${p.slug}`, lastModified: p.updatedAt })),
    ...posts.map((p) => ({ url: `${base}/blog/${p.slug}`, lastModified: p.publishedAt })),
    ...events.map((e) => ({ url: `${base}/events/${e.slug}` })),
  ];
}
