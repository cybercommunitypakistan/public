// =============================================================================
// FILE: lib/auth/permissions.ts
// Every permission the admin panel checks, grouped for the Roles editor, plus
// the roles created by the seed. Add a key here, then guard with
// requirePermission('<key>') in the page / action.
// =============================================================================

export const PERMISSION_GROUPS = {
  General: {
    'dashboard.view': 'See the dashboard',
    'media.upload': 'Upload images',
  },
  Site: {
    'settings.manage': 'Edit site settings & logo',
    'theme.manage': 'Change colour scheme',
    'content.manage': 'Edit home/about sections (hero text, FAQ…)',
    'navigation.manage': 'Edit menu & footer links',
  },
  Pages: {
    'pages.edit': 'Create and edit pages',
    'pages.publish': 'Publish, disable or delete pages',
  },
  Blog: {
    'blog.write': 'Write and edit own posts',
    'blog.publish': 'Publish posts',
    'blog.manage': 'Edit or delete anyone’s posts',
  },
  Events: {
    'events.manage': 'Create and edit events',
    'forms.manage': 'Build forms',
    'submissions.view': 'See registrations & responses',
    'submissions.export': 'Export / delete responses (personal data)',
  },
  Administration: {
    'users.manage': 'Invite, edit and disable users',
    'roles.manage': 'Create and edit roles',
    'security.view': 'See security log, honeypot hits, blocked IPs',
    'security.manage': 'Block / unblock IPs, security settings',
  },
} as const;

type Groups = typeof PERMISSION_GROUPS;
export type Permission = { [G in keyof Groups]: keyof Groups[G] }[keyof Groups];
export const ALL_PERMISSIONS = Object.values(PERMISSION_GROUPS).flatMap((g) => Object.keys(g)) as Permission[];
export const isPermission = (p: string): p is Permission => (ALL_PERMISSIONS as string[]).includes(p);

export const DEFAULT_ROLES: { slug: string; name: string; description: string; system?: boolean; permissions: Permission[] }[] = [
  { slug: 'owner', name: 'Owner', description: 'Full access. Cannot be deleted.', system: true, permissions: ALL_PERMISSIONS },
  {
    slug: 'admin', name: 'Admin', description: 'Everything except managing roles.',
    permissions: ALL_PERMISSIONS.filter((p) => p !== 'roles.manage'),
  },
  {
    slug: 'editor', name: 'Editor', description: 'Content, pages, blog and events.',
    permissions: ['dashboard.view', 'media.upload', 'content.manage', 'navigation.manage', 'pages.edit', 'pages.publish', 'blog.write', 'blog.publish', 'blog.manage', 'events.manage', 'forms.manage', 'submissions.view'],
  },
  {
    slug: 'event-manager', name: 'Event manager', description: 'Events, forms and registrations.',
    permissions: ['dashboard.view', 'media.upload', 'events.manage', 'forms.manage', 'submissions.view', 'submissions.export'],
  },
  { slug: 'author', name: 'Author', description: 'Writes posts; an editor publishes them.', permissions: ['dashboard.view', 'media.upload', 'blog.write'] },
];
