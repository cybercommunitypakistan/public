// =============================================================================
// FILE: components/layout/nav-utils.ts
// Tiny helpers shared by the header and the menu.
// =============================================================================

export type LinkKind = 'hash' | 'route' | 'external' | 'mail';

export function linkKind(href: string): LinkKind {
  if (href.startsWith('#')) return 'hash';
  if (href.startsWith('mailto:') || href.startsWith('tel:')) return 'mail';
  if (/^https?:\/\//.test(href)) return 'external';
  return 'route';
}

/** Extra <a> props for links that open in a new tab. */
export function externalProps(href: string) {
  return linkKind(href) === 'external' ? { target: '_blank', rel: 'noopener noreferrer' } : {};
}
