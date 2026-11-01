// =============================================================================
// FILE: components/footer/SiteFooter.tsx
// Site footer (rendered once in app/layout.tsx), inspired by noth.in:
//   - "Curtain" reveal: the footer sits fixed underneath and the page slides
//     up to uncover it (clip-path wrapper + fixed inner). Falls back to a
//     normal footer when it is taller than the screen.
//   - Content drifts into place (parallax) and the headline rises while you
//     scroll into it; the giant CCP wordmark letters rise one by one.
//   - Wordmark uses the ink engine: hover paints white ink and reveals the
//     emerald texture inside the letters.
//   - Rolling hover on links, magnetic pill CTAs, live Pakistan clock,
//     smooth back-to-top (Lenis).
// =============================================================================

'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useLenis } from 'lenis/react';
import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion } from '@/lib/gsap';
import type { InkEngine } from '@/components/hero/ink/InkEngine';
import { useSite } from '@/components/providers/SiteProvider';
import FooterWordmark from './FooterWordmark';
import PillButton from './PillButton';
import RollText from './RollText';
import LocalTime from './LocalTime';


const Arrow = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export default function SiteFooter() {
  const site = useSite();
  const { footer } = site;
  const wrap = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLElement>(null);
  const [height, setHeight] = useState<number | null>(null);
  const [curtain, setCurtain] = useState(true);
  const [engine, setEngine] = useState<InkEngine | null>(null);
  const lenis = useLenis();

  // ---- size the wrapper to the footer; use curtain mode only if it fits ----
  useEffect(() => {
    const el = inner.current;
    if (!el) return;
    const measure = () => {
      const h = el.offsetHeight;
      setHeight(h);
      setCurtain(h <= window.innerHeight);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  useEffect(() => {
    ScrollTrigger.refresh();
  }, [height, curtain]);

  // ---- scroll-driven animations ----
  useGSAP(
    () => {
      const reduce = prefersReducedMotion();
      if (engine && reduce) engine.reveal = 1;
      if (reduce) return;
      const q = gsap.utils.selector(inner);
      const st = { trigger: wrap.current, start: 'top bottom', end: 'bottom bottom', scrub: true };

      // content drifts in from above (curtain parallax)
      if (curtain) gsap.fromTo(q('[data-ft="content"]'), { yPercent: -18 }, { yPercent: 0, ease: 'none', scrollTrigger: st });

      // headline lines rise
      gsap.fromTo(
        q('[data-ft="line"]'),
        { yPercent: 110 },
        { yPercent: 0, ease: 'none', stagger: 0.12, scrollTrigger: { ...st, end: 'bottom 85%' } },
      );
      gsap.fromTo(
        q('[data-ft="fade"]'),
        { autoAlpha: 0, y: 30 },
        { autoAlpha: 1, y: 0, ease: 'none', stagger: 0.06, scrollTrigger: { ...st, start: 'top 85%', end: 'bottom 90%' } },
      );

      // wordmark letters rise
      if (engine) {
        const proxy = { v: engine.reveal };
        gsap.to(proxy, {
          v: 1,
          ease: 'none',
          onUpdate: () => (engine.reveal = proxy.v),
          scrollTrigger: { ...st, start: 'top 70%' },
        });
      }
    },
    { dependencies: [engine, curtain], revertOnUpdate: true },
  );

  const year = new Date().getFullYear();

  return (
    <div
      ref={wrap}
      className="relative"
      style={{
        height: curtain && height ? height : undefined,
        clipPath: curtain ? 'polygon(0% 0, 100% 0%, 100% 100%, 0 100%)' : undefined,
      }}
    >
      <footer
        ref={inner}
        className={`${curtain ? 'fixed bottom-0 left-0' : 'relative'} w-full overflow-hidden bg-ink-deep text-paper`}
      >
        <div data-ft="content" className="flex h-[100svh] min-h-[600px] flex-col will-change-transform">
          {/* ---------- Top: headline, CTAs, socials ---------- */}
          <div className="grid shrink-0 gap-8 px-4 pt-20 sm:px-6 sm:pt-24 lg:grid-cols-12 lg:gap-10 lg:px-10">
            <div className="lg:col-span-8">
              <p data-ft="fade" className="font-mono text-[11px] uppercase tracking-[0.22em] text-emerald">
                // {footer.eyebrow}
              </p>
              <h2 className="mt-4 text-[clamp(40px,5.8vw,96px)] font-medium leading-[0.95] tracking-[-0.055em]">
                {footer.headline.map((l) => (
                  <span key={l} className="-mb-[0.18em] block overflow-hidden pb-[0.24em]">
                    <span data-ft="line" className="block">
                      {l}
                    </span>
                  </span>
                ))}
              </h2>
              <div data-ft="fade" className="mt-7 flex flex-wrap gap-3">
                <PillButton href={site.applyUrl} external icon={Arrow}>
                  {footer.primaryCta}
                </PillButton>
                <PillButton href={`mailto:${site.email}`} icon={<span className="text-[13px] leading-none">@</span>}>
                  {footer.emailCta}
                </PillButton>
              </div>
            </div>

            <nav aria-label="Social" data-ft="fade" className="lg:col-span-3 lg:col-start-10 lg:pt-9">
              <ul className="flex flex-wrap gap-x-6 gap-y-1 text-[clamp(20px,1.9vw,30px)] leading-[1.15] tracking-[-0.02em] lg:block lg:space-y-1">
                {site.socials.map((s) => (
                  <li key={s.label}>
                    <a href={s.href} target="_blank" rel="noopener noreferrer" className="group/roll inline-flex">
                      <RollText text={s.label} />
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* ---------- Giant ink wordmark ---------- */}
          <FooterWordmark word={footer.wordmark} onReady={setEngine} className="mt-6 min-h-[110px] flex-1" />

          {/* ---------- Bottom bar ---------- */}
          <div className="flex shrink-0 flex-col gap-4 px-4 pb-5 pt-4 text-[12px] text-paper/75 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-10 lg:pb-6">
            <p className="flex flex-wrap items-center gap-x-5 gap-y-1">
              <span>
                ©{year} — {site.name}
              </span>
              <a href={`mailto:${site.email}`} className="group/roll inline-flex hover:text-paper">
                <RollText text={site.email} />
              </a>
              <span className="flex items-center gap-2">
                <span className="size-1.5 animate-pulse rounded-full bg-emerald" />
                {footer.location} · <LocalTime timeZone={footer.timeZone} />
              </span>
              <span className="text-paper/45">{footer.tagline}</span>
            </p>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2 font-mono text-[13px] font-bold uppercase tracking-[0.02em] text-paper">
                {footer.nav.map((n) => (
                  <Link key={n.href} href={n.href} className="group/roll inline-flex">
                    <RollText text={n.label} />
                  </Link>
                ))}
              </nav>
              <button
                type="button"
                onClick={() => lenis?.scrollTo(0, { duration: 2.2 })}
                className="group/top inline-flex items-center gap-2 rounded-full border border-paper/20 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-paper transition-colors hover:border-emerald hover:text-emerald"
              >
                Top
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden className="transition-transform duration-300 group-hover/top:-translate-y-0.5">
                  <path d="M12 19V5M6 11l6-6 6 6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
