// =============================================================================
// FILE: components/layout/SiteHeader.tsx
// Minimal fixed header: logo (left) + Menu button (right). All navigation
// lives in the full-screen menu (MenuOverlay).
//
// Blend note: logo and button are two separate fixed layers. Each one carries
// its own `mix-blend-difference`, so it stays readable over paper, ink and
// every section. A full-colour image logo can opt out with `logo.blend: false`.
// Items marked data-fx="header" are animated in by the hero intro.
// =============================================================================

'use client';

import { useCallback, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useLenis } from 'lenis/react';
import MenuOverlay from './MenuOverlay';
import SiteLogo from './SiteLogo';
import { useSite } from '@/components/providers/SiteProvider';

export default function SiteHeader() {
  const site = useSite();
  const [open, setOpen] = useState(false);
  const menuBtn = useRef<HTMLButtonElement>(null);
  const lenis = useLenis();
  const router = useRouter();
  const pathname = usePathname();

  const blendLogo = !site.logo || site.logo.blend !== false;

  const close = useCallback(() => {
    setOpen(false);
    menuBtn.current?.focus({ preventScroll: true });
  }, []);

  return (
    <>
      {/* Logo layer */}
      <a
        href="/"
        onClick={(e) => {
          e.preventDefault();
          // on the home page: scroll to top; elsewhere: go home
          if (pathname === '/') lenis?.scrollTo(0, { duration: 1.4 });
          else router.push('/');
        }}
        data-fx="header"
        aria-label={`${site.name} — home`}
        className={`fixed left-4 top-4 z-50 inline-flex items-center sm:left-6 lg:left-10 lg:top-6 ${
          blendLogo ? 'text-white mix-blend-difference' : ''
        }`}
      >
        <SiteLogo priority />
      </a>

      {/* Menu button layer */}
      <button
        ref={menuBtn}
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="site-menu"
        data-fx="header"
        className="group fixed right-4 top-4 z-50 inline-flex h-8 items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white mix-blend-difference sm:right-6 lg:right-10 lg:top-6 lg:h-[34px]"
      >
        Menu
        <span aria-hidden className="grid grid-cols-2 gap-[3px] transition-transform duration-500 group-hover:rotate-90">
          <i className="size-[3px] bg-current" />
          <i className="size-[3px] bg-current" />
          <i className="size-[3px] bg-current" />
          <i className="size-[3px] bg-current" />
        </span>
      </button>

      <MenuOverlay open={open} onClose={close} />
    </>
  );
}
