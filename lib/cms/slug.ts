// FILE: lib/cms/slug.ts — URL slugs + reserved paths
export function slugify(input: string, max = 80): string {
  return input
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9/]+/g, '-').replace(/\/+/g, '/')
    .replace(/(^[-/]+|[-/]+$)/g, '').slice(0, max);
}

/** paths owned by code — custom pages can't use them */
export const RESERVED_SLUGS = ['admin', 'api', 'blog', 'events', 'forms', 'about', '_next', 'sitemap.xml', 'robots.txt', 'favicon.ico', 'internal-archive', 'login', 'wp-admin'];

export const PAGE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*){0,3}$/;
export const isReservedSlug = (slug: string) => RESERVED_SLUGS.includes(slug.split('/')[0]);

/** safe href for user-entered links: relative, http(s), mailto, tel, #anchor */
export function safeHref(href: unknown): string {
  const h = String(href ?? '').trim();
  if (!h) return '#';
  if (/^(https?:|mailto:|tel:)/i.test(h) || h.startsWith('/') || h.startsWith('#')) return h.startsWith('//') ? '#' : h;
  return '#';
}
