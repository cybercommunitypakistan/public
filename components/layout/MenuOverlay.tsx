// =============================================================================
// FILE: components/layout/MenuOverlay.tsx
// Full-screen menu driven by the menu in the database (Admin → Menu):
//   - any number of top-level links
//   - dropdowns (items with `children`) that expand smoothly, one at a time
//   - badges ('Open', 'New'), descriptions, external-link arrows
//   - '#section' → closes menu then smooth-scrolls (Lenis); if the section
//                  isn't on this page, goes to the home page section
//     '/route'   → closes menu then navigates ('/' on the home page = scroll to top)
//     '/route#x' → navigates, then scrolls to #x
//     'https://' → opens in a new tab
// GSAP wipes the panel in; rows rise with a stagger. Lenis is paused while the
// menu is open; the list scrolls on its own if it is taller than the screen.
// Scrolling: the native scrollbar is hidden. Instead a thin emerald indicator
// (and soft top/bottom fades) appear ONLY when the list really overflows.
// =============================================================================

'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useLenis } from 'lenis/react';
import { gsap, useGSAP } from '@/lib/gsap';
import type { MenuChild, MenuItem } from '@/lib/content/types';
import { useSite } from '@/components/providers/SiteProvider';
import SiteLogo from './SiteLogo';
import { externalProps, linkKind } from './nav-utils';

type Props = { open: boolean; onClose: () => void };

// ---------- small pieces ------------------------------------------------------

function Badge({ children, tone = 'emerald' }: { children: React.ReactNode; tone?: 'emerald' | 'outline' }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] font-medium uppercase leading-none tracking-[0.12em] ${
        tone === 'emerald' ? 'bg-emerald text-ink' : 'border border-emerald/50 text-emerald'
      }`}
    >
      {tone === 'emerald' && <span className="size-1.5 animate-pulse rounded-full bg-ink" />}
      {children}
    </span>
  );
}

function ArrowUpRight({ className = '' }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
      <path d="M7 17 17 7M8 7h9v9" />
    </svg>
  );
}

// ---------- main --------------------------------------------------------------

export default function MenuOverlay({ open, onClose }: Props) {
  const site = useSite();
  const root = useRef<HTMLDivElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const lenis = useLenis();
  const router = useRouter();
  const pathname = usePathname();

  // ---- custom scroll indicator + edge fades ----
  const scroller = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const thumb = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scroller.current;
    const tr = track.current;
    const th = thumb.current;
    if (!el || !tr || !th) return;
    let raf = 0;

    const update = () => {
      raf = 0;
      const { scrollTop, scrollHeight, clientHeight } = el;
      const max = scrollHeight - clientHeight;
      const overflow = max > 2;

      tr.style.opacity = overflow ? '1' : '0';
      if (overflow) {
        const trackH = tr.clientHeight;
        const thumbH = Math.max(28, (clientHeight / scrollHeight) * trackH);
        th.style.height = `${thumbH}px`;
        th.style.transform = `translateY(${(scrollTop / max) * (trackH - thumbH)}px)`;
      }

      // fade the edge only on the side that has more content
      const top = overflow && scrollTop > 4 ? 40 : 0;
      const bottom = overflow && scrollTop < max - 4 ? 56 : 0;
      const mask =
        top || bottom
          ? `linear-gradient(to bottom, transparent 0, #000 ${top}px, #000 calc(100% - ${bottom}px), transparent 100%)`
          : 'none';
      el.style.maskImage = mask;
      el.style.webkitMaskImage = mask;
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    el.addEventListener('scroll', schedule, { passive: true });
    const ro = new ResizeObserver(schedule); // window resize + dropdown open/close
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    schedule();

    return () => {
      el.removeEventListener('scroll', schedule);
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  // ---- open / close animation ----
  useGSAP(
    () => {
      gsap.set(root.current, { clipPath: 'inset(0% 0% 100% 0%)', visibility: 'hidden' });
      tl.current = gsap
        .timeline({
          paused: true,
          defaults: { ease: 'expo.inOut' },
          onReverseComplete: () => setExpanded(null),
        })
        .set(root.current, { visibility: 'visible' })
        .to(root.current, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9 })
        .fromTo('[data-menu-row]', { yPercent: 110 }, { yPercent: 0, duration: 0.9, ease: 'expo.out', stagger: 0.05 }, 0.35)
        .fromTo('[data-menu-fade]', { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power2.out', stagger: 0.05 }, 0.5);
    },
    { scope: root },
  );

  useEffect(() => {
    if (!tl.current) return;
    if (open) {
      lenis?.stop();
      tl.current.timeScale(1).play();
      root.current?.querySelector<HTMLElement>('[data-menu-row]')?.focus({ preventScroll: true });
    } else {
      lenis?.start();
      tl.current.timeScale(1.6).reverse();
    }
  }, [open, lenis]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // ---- link behaviour ----
  const navigate = (href: string) => (e: React.MouseEvent) => {
    const kind = linkKind(href);
    if (kind === 'external' || kind === 'mail') return; // browser default

    e.preventDefault();
    onClose();

    // split '/about#team' → path '/about' + hash '#team'; '#x' → current page
    const at = href.indexOf('#');
    const path = kind === 'hash' ? pathname : (at >= 0 ? href.slice(0, at) : href) || pathname;
    const hash = at >= 0 ? href.slice(at) : '';

    // wait for the close animation, then scroll or navigate
    setTimeout(() => {
      if (path !== pathname) {
        router.push(path + hash); // another page (SmoothScroll handles the hash after load)
      } else if (!hash || hash === '#top') {
        lenis?.scrollTo(0, { duration: 1.6 });
      } else if (document.querySelector(hash)) {
        lenis?.scrollTo(hash, { duration: 1.6 });
      } else {
        router.push(`/${hash}`); // section not on this page → home page section
      }
    }, 450);
  };

  const toggle = (i: number) => setExpanded((cur) => (cur === i ? null : i));

  // ---- render ----
  const rowText =
    'font-display text-[clamp(28px,7.4vw,84px)] sm:text-[clamp(30px,6vw,84px)] lg:text-[clamp(30px,5vw,84px)] font-black uppercase leading-[0.98] tracking-[-0.04em]';

  return (
    <div
      ref={root}
      id="site-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Site menu"
      aria-hidden={!open}
      inert={!open}
      className="invisible fixed inset-0 z-[60] flex flex-col bg-ink text-paper"
    >
      {/* Top bar */}
      <div className="flex shrink-0 items-center justify-between px-4 py-4 sm:px-6 lg:px-10 lg:py-6">
        <a href="/" onClick={navigate('/')} data-menu-fade aria-label={`${site.name} — home`} className="inline-flex items-center">
          <SiteLogo />
        </a>
        <button
          type="button"
          onClick={onClose}
          data-menu-fade
          className="inline-flex h-8 items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors hover:text-emerald lg:h-[34px]"
        >
          Close
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>

      {/* Body */}
      <div className="grid min-h-0 flex-1 gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-16 lg:px-10 xl:grid-cols-[minmax(0,1fr)_400px]">
        {/* Links (scrolls by itself when long — silent scrollbar + custom indicator) */}
        <div className="relative flex min-h-0">
          <nav
            ref={scroller}
            aria-label="Main"
            data-lenis-prevent
            className="no-scrollbar flex min-h-0 w-full overflow-y-auto overflow-x-hidden overscroll-contain py-4 pr-3 sm:py-6 sm:pr-5 lg:py-8"
          >
            <ul className="group/list my-auto w-full">
              {site.menu.map((item: MenuItem, i) => {
                const isOpen = expanded === i;
                const hasChildren = !!item.children?.length;
                const panelId = `menu-panel-${i}`;
                const num = String(i + 1).padStart(2, '0');

                const inner = (
                  <>
                    <span className="w-7 shrink-0 self-start pt-[0.5em] font-mono text-xs font-normal tracking-normal text-emerald sm:w-9 sm:text-sm">
                      {num}
                    </span>
                    <span className="relative min-w-0">
                      {item.label}
                      {/* phones: badge shrinks to a dot so long words never break */}
                      {item.badge && <span aria-hidden className="absolute -right-3 top-[0.12em] size-2 animate-pulse rounded-full bg-emerald sm:hidden" />}
                    </span>
                    {item.badge && (
                      <span className="hidden self-center sm:inline-flex">
                        <Badge>{item.badge}</Badge>
                      </span>
                    )}
                    {hasChildren && (
                      <span
                        aria-hidden
                        className={`relative ml-auto size-6 shrink-0 self-center transition-transform duration-500 sm:size-8 ${isOpen ? 'rotate-45 text-emerald' : ''}`}
                      >
                        <span className="absolute left-0 top-1/2 h-[2px] w-full -translate-y-1/2 bg-current" />
                        <span className="absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 bg-current" />
                      </span>
                    )}
                    {!hasChildren && item.href && linkKind(item.href) === 'external' && (
                      <ArrowUpRight className="ml-auto size-6 shrink-0 self-center sm:size-8" />
                    )}
                  </>
                );

                const rowClass = `flex w-full items-baseline gap-3 py-1 text-left outline-none transition-[color,opacity] duration-300 sm:gap-4 ${rowText} ${
                  isOpen
                    ? 'text-emerald'
                    : `hover:text-emerald focus-visible:text-emerald ${expanded === null ? 'lg:group-hover/list:opacity-45 lg:hover:!opacity-100' : ''}`
                }`;

                return (
                  <li key={`${item.label}-${i}`} className="border-b border-white/[0.07] last:border-b-0">
                    <div className="overflow-hidden">
                      {hasChildren ? (
                        <button
                          type="button"
                          data-menu-row
                          aria-expanded={isOpen}
                          aria-controls={panelId}
                          onClick={() => toggle(i)}
                          className={rowClass}
                        >
                          {inner}
                        </button>
                      ) : (
                        <a data-menu-row href={item.href ?? '#'} onClick={navigate(item.href ?? '#')} {...externalProps(item.href ?? '')} className={rowClass}>
                          {inner}
                        </a>
                      )}
                    </div>

                    {/* Dropdown panel (smooth height via grid-rows) */}
                    {hasChildren && (
                      <div
                        id={panelId}
                        className={`grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(.16,1,.3,1)] ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                      >
                        <div className="overflow-hidden">
                          <ul className="grid gap-x-8 gap-y-1 pb-5 pl-10 pt-1 sm:grid-cols-2 sm:pb-7 sm:pl-[52px] xl:grid-cols-3">
                            {item.children!.map((c: MenuChild, j) => (
                              <li
                                key={`${c.label}-${j}`}
                                style={{ transitionDelay: isOpen ? `${120 + j * 50}ms` : '0ms' }}
                                className={`transition-[opacity,transform] duration-500 ${isOpen ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'}`}
                              >
                                <a
                                  href={c.href}
                                  onClick={navigate(c.href)}
                                  {...externalProps(c.href)}
                                  tabIndex={isOpen ? 0 : -1}
                                  className="group/child -mx-3 flex items-start gap-3 rounded-xl px-3 py-2.5 outline-none transition-colors hover:bg-white/[0.05] focus-visible:bg-white/[0.07]"
                                >
                                  <span className="min-w-0 flex-1">
                                    <span className="flex flex-wrap items-center gap-2 text-[17px] font-semibold tracking-[-0.01em] transition-colors group-hover/child:text-emerald sm:text-lg">
                                      {c.label}
                                      {c.badge && <Badge tone="outline">{c.badge}</Badge>}
                                    </span>
                                    {c.description && <span className="mt-0.5 block text-[13.5px] leading-snug text-paper/55">{c.description}</span>}
                                  </span>
                                  <ArrowUpRight
                                    className={`mt-1 shrink-0 text-emerald transition-all duration-300 ${
                                      linkKind(c.href) === 'external'
                                        ? 'opacity-100'
                                        : '-translate-x-1 translate-y-1 opacity-0 group-hover/child:translate-x-0 group-hover/child:translate-y-0 group-hover/child:opacity-100'
                                    }`}
                                  />
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Custom scroll indicator (hidden when nothing to scroll) */}
          <div
            ref={track}
            aria-hidden
            className="pointer-events-none absolute bottom-6 right-0 top-6 w-[2px] rounded-full bg-white/[0.08] opacity-0 transition-opacity duration-300 lg:bottom-10 lg:top-10"
          >
            <div ref={thumb} className="w-full rounded-full bg-emerald shadow-[0_0_10px] shadow-emerald/60 will-change-transform" />
          </div>
        </div>

        {/* Feature card + contact (desktop side column) */}
        <aside className="hidden flex-col justify-end gap-8 pb-10 lg:flex">
          <FeatureCard />
          <ContactBlock />
        </aside>
      </div>

      {/* Mobile footer */}
      <div className="shrink-0 space-y-4 border-t border-white/[0.07] px-4 pb-5 pt-4 sm:px-6 lg:hidden">
        <a
          data-menu-fade
          href={site.applyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between rounded-full bg-emerald px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.14em] text-ink"
        >
          {site.menuFeature.cta} — Ambassador Program
          <ArrowUpRight />
        </a>
        <ContactBlock compact />
      </div>
    </div>
  );
}

// ---------- side pieces -------------------------------------------------------

function FeatureCard() {
  const site = useSite();
  const f = site.menuFeature;
  return (
    <a
      data-menu-fade
      href={site.applyUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-3xl border border-emerald/30 bg-gradient-to-br from-emerald/15 via-emerald/5 to-transparent p-7 transition-colors duration-500 hover:border-emerald"
    >
      <Badge>{f.eyebrow}</Badge>
      <p className="mt-6 font-display text-3xl font-extrabold leading-[1.02] tracking-[-0.03em]">{f.title}</p>
      <p className="mt-3 text-[14.5px] leading-relaxed text-paper/65">{f.body}</p>
      <span className="mt-7 inline-flex items-center gap-2 rounded-full bg-emerald px-5 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-ink transition-[gap] duration-300 group-hover:gap-3">
        {f.cta}
        <ArrowUpRight />
      </span>
    </a>
  );
}

function ContactBlock({ compact = false }: { compact?: boolean }) {
  const site = useSite();
  return (
    <div data-menu-fade className={`flex text-sm ${compact ? 'flex-wrap items-center justify-between gap-3' : 'flex-col gap-4'}`}>
      <a href={`mailto:${site.email}`} className="text-paper/70 transition-colors hover:text-emerald">
        {site.email}
      </a>
      <div className="flex gap-5 text-[11px] font-semibold uppercase tracking-[0.14em]">
        {site.socials.map((s) => (
          <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-emerald">
            {s.label}
          </a>
        ))}
      </div>
    </div>
  );
}
