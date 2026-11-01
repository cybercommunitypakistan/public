// =============================================================================
// FILE: lib/content/tags.ts
// Cache tags. Queries are cached under these tags; after an admin edit, call
// revalidateContent('<tag>') and every page using that data refreshes.
// =============================================================================

export const TAGS = {
  site: 'site', // settings, logo, menu, socials, footer links, site.* sections
  sections: 'sections', // any Section row
  programs: 'programs',
  events: 'events',
  testimonials: 'testimonials',
  faqs: 'faqs',
  team: 'team',
} as const;

export type ContentTag = (typeof TAGS)[keyof typeof TAGS];
