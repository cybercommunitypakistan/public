// FILE: components/admin/Sidebar.tsx — navigation filtered by the user's permissions
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { logout } from '@/app/admin/_actions/auth';
import type { Permission } from '@/lib/auth/permissions';
import { cx } from './ui';

const I = {
  dash: 'M4 13h6V4H4v9Zm0 7h6v-4H4v4Zm10 0h6v-9h-6v9Zm0-16v4h6V4h-6Z',
  page: 'M7 3h7l5 5v13H7V3Zm7 0v5h5',
  blog: 'M4 20h4L19 9l-4-4L4 16v4Zm11-15 4 4',
  event: 'M7 3v3M17 3v3M4 8h16M5 5h14v15H5V5Zm4 7h2v2H9v-2Z',
  form: 'M5 4h14v16H5V4Zm4 4h6M9 12h6M9 16h3',
  text: 'M5 6h14M5 12h10M5 18h7',
  nav: 'M4 6h16M4 12h16M4 18h10',
  palette: 'M12 3a9 9 0 1 0 0 18c1.1 0 1.5-.8 1.1-1.7-.6-1.3.3-2.3 1.6-2.3H17a4 4 0 0 0 4-4c0-5.5-4-10-9-10Zm-5 9h.01M9 7h.01M15 7h.01',
  gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.4 7.4 0 0 0-.1-1.3l2-1.6-2-3.4-2.4 1a7.6 7.6 0 0 0-2.2-1.3L14.4 3h-4l-.4 2.5a7.6 7.6 0 0 0-2.2 1.3l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2.6l-2 1.6 2 3.4 2.4-1a7.6 7.6 0 0 0 2.2 1.3l.4 2.5h4l.4-2.5a7.6 7.6 0 0 0 2.2-1.3l2.4 1 2-3.4-2-1.6c.1-.4.1-.9.1-1.3Z',
  users: 'M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm13 9v-1a4 4 0 0 0-3-3.9M16 4.1a3 3 0 0 1 0 5.8',
  key: 'M15 7a4 4 0 1 1-3.9 5H3v3h3v3h3v-3h2.1A4 4 0 0 1 15 7Zm1 3h.01',
  shield: 'M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6l-8-3Z',
  user: 'M20 21a8 8 0 1 0-16 0M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
};

type Item = { href: string; label: string; icon: keyof typeof I; perm?: Permission };
const GROUPS: { title: string; items: Item[] }[] = [
  { title: 'Overview', items: [{ href: '/admin', label: 'Dashboard', icon: 'dash', perm: 'dashboard.view' }] },
  { title: 'Content', items: [
    { href: '/admin/pages', label: 'Pages', icon: 'page', perm: 'pages.edit' },
    { href: '/admin/content', label: 'Sections & hero', icon: 'text', perm: 'content.manage' },
    { href: '/admin/blog', label: 'Blog', icon: 'blog', perm: 'blog.write' },
    { href: '/admin/navigation', label: 'Navigation', icon: 'nav', perm: 'navigation.manage' },
  ] },
  { title: 'Events', items: [
    { href: '/admin/events', label: 'Events', icon: 'event', perm: 'events.manage' },
    { href: '/admin/forms', label: 'Forms', icon: 'form', perm: 'forms.manage' },
  ] },
  { title: 'Appearance', items: [
    { href: '/admin/theme', label: 'Colour scheme', icon: 'palette', perm: 'theme.manage' },
    { href: '/admin/settings', label: 'Settings & logo', icon: 'gear', perm: 'settings.manage' },
  ] },
  { title: 'Administration', items: [
    { href: '/admin/users', label: 'Users', icon: 'users', perm: 'users.manage' },
    { href: '/admin/roles', label: 'Roles', icon: 'key', perm: 'roles.manage' },
    { href: '/admin/security', label: 'Security', icon: 'shield', perm: 'security.view' },
  ] },
];

export default function Sidebar({ user }: { user: { name: string; email: string; role: string; permissions: Permission[] } }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const active = (href: string) => (href === '/admin' ? path === '/admin' : path.startsWith(href));

  const nav = (
    <nav className="flex h-full flex-col">
      <Link href="/admin" className="flex items-center gap-3 px-5 py-6">
        <span className="grid size-9 place-items-center rounded-xl bg-emerald text-ink">
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2"><path d={I.shield} /></svg>
        </span>
        <span>
          <span className="block font-display text-[15px] font-black uppercase leading-none tracking-tight">CCP Admin</span>
          <span className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-paper/40">Control room</span>
        </span>
      </Link>
      <div className="flex-1 space-y-6 overflow-y-auto px-3 pb-6">
        {GROUPS.map((g) => {
          const items = g.items.filter((i) => !i.perm || user.permissions.includes(i.perm));
          if (!items.length) return null;
          return (
            <div key={g.title}>
              <p className="px-3 pb-2 font-mono text-[9.5px] uppercase tracking-[0.22em] text-paper/30">{g.title}</p>
              {items.map((i) => (
                <Link key={i.href} href={i.href} onClick={() => setOpen(false)}
                  className={cx('group flex items-center gap-3 rounded-xl px-3 py-2 text-[13.5px] transition', active(i.href) ? 'bg-emerald/12 text-paper' : 'text-paper/60 hover:bg-white/[0.04] hover:text-paper')}>
                  <svg viewBox="0 0 24 24" className={cx('size-[18px] shrink-0', active(i.href) ? 'text-emerald' : 'text-paper/40 group-hover:text-paper/70')} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={I[i.icon]} /></svg>
                  {i.label}
                  {active(i.href) && <span className="ml-auto h-4 w-1 rounded-full bg-emerald" />}
                </Link>
              ))}
            </div>
          );
        })}
      </div>
      <div className="border-t border-white/[0.06] p-3">
        <Link href="/admin/account" className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-white/[0.04]">
          <span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-emerald to-emerald-soft font-bold text-ink">{user.name.charAt(0).toUpperCase()}</span>
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-semibold">{user.name}</span>
            <span className="block truncate font-mono text-[10px] uppercase tracking-[0.14em] text-emerald/80">{user.role}</span>
          </span>
        </Link>
        <div className="mt-1 flex gap-1">
          <a href="/" target="_blank" className="flex-1 rounded-lg px-3 py-2 text-center text-[12px] text-paper/50 hover:bg-white/[0.04] hover:text-paper">View site ↗</a>
          <form action={logout} className="flex-1"><button className="w-full rounded-lg px-3 py-2 text-[12px] text-paper/50 hover:bg-rose/10 hover:text-rose">Sign out</button></form>
        </div>
      </div>
    </nav>
  );

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-white/[0.06] bg-ink-deep/90 px-4 py-3 backdrop-blur lg:hidden">
        <span className="font-display text-sm font-black uppercase">CCP Admin</span>
        <button onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="Menu" className="rounded-lg border border-white/10 px-3 py-1.5 text-[12px]">{open ? 'Close' : 'Menu'}</button>
      </div>
      {open && <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={cx('fixed inset-y-0 left-0 z-50 w-[264px] border-r border-white/[0.06] bg-ink transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0', open ? 'translate-x-0' : '-translate-x-full')}>
        {nav}
      </aside>
    </>
  );
}
