// =============================================================================
// FILE: components/hero/CyberHero.tsx
// Cyber Community Pakistan — liquid ink hero.
//   Intro (GSAP): the hero starts flooded with ink, the ink drains away to
//   reveal the wordmark, then header / tagline / CTAs / badge animate in.
//   Hover: the cursor paints ink; inside the letters it reveals a glossy
//   emerald "cyber liquid" texture.
//   Scroll (GSAP ScrollTrigger + Lenis): ink rises from the bottom and flows
//   seamlessly into the next (navy) section; the wordmark parallaxes.
// Blend note: every element with `mix-blend-difference` is animated directly
// (never a wrapper), otherwise the wrapper would isolate the blend.
// =============================================================================

'use client';

import { useRef, useState, useEffect } from 'react';
import InkCanvas from './ink/InkCanvas';
import type { InkEngine } from './ink/InkEngine';
import RotatingBadge from './RotatingBadge';
import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion } from '@/lib/gsap';
import { DISPLAY_FONT, DISPLAY_WEIGHT } from '@/lib/fonts';
import { useSite } from '@/components/providers/SiteProvider';
import type { SectionContent } from '@/lib/content/schemas';


export default function CyberHero({ hero }: { hero: SectionContent<'home.hero'> }) {
  const site = useSite();
  const primaryHref = hero.primaryHref || site.applyUrl;
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  const [engine, setEngine] = useState<InkEngine | null>(null);
  const [fallback, setFallback] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Mount effect to prevent hydration mismatch and delay heavy WebGL initialization
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useGSAP(
    () => {
      if ((!engine && !fallback) || started.current || !isMounted) return;
      started.current = true;
      const reduce = prefersReducedMotion();
      const all = '[data-fx]';

      const setupScroll = () => {
        const trigger = { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true };
        if (engine) {
          ScrollTrigger.create({
            ...trigger,
            scrub: false,
            onUpdate: (self) => (engine.scroll = Math.min(1, self.progress * 0.95)),
          });
        }
        if (!reduce) {
          gsap.to(stage.current, { yPercent: 28, ease: 'none', scrollTrigger: trigger });
          gsap.to('[data-scroll="fade"]', {
            y: -70,
            opacity: 0,
            ease: 'none',
            stagger: 0.02,
            scrollTrigger: { ...trigger, end: '45% top' },
          });
        }
        ScrollTrigger.refresh();
      };

      if (reduce) {
        gsap.set(all, { autoAlpha: 1 });
        if (engine) engine.intro = 0;
        setupScroll();
        return;
      }

      const tl = gsap.timeline({ defaults: { ease: 'expo.out' }, onComplete: setupScroll });
      if (engine) tl.to(engine, { intro: 0, duration: 2.1, ease: 'power3.inOut' }, 0.15);
      const at = engine ? 1.05 : 0.1;
      tl.fromTo('[data-fx="header"]', { autoAlpha: 0, yPercent: -80 }, { autoAlpha: 1, yPercent: 0, duration: 1.1, stagger: 0.05 }, at)
        .fromTo('[data-fx="line"]', { autoAlpha: 1, yPercent: 115 }, { yPercent: 0, duration: 1.3, stagger: 0.09 }, at + 0.1)
        .fromTo('[data-fx="cta"]', { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.08 }, at + 0.35)
        .fromTo('[data-fx="bottom"]', { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.06 }, at + 0.45)
        .fromTo(
          '[data-fx="badge"]',
          { autoAlpha: 0, scale: 0.4, rotate: -120 },
          { autoAlpha: 1, scale: 1, rotate: 0, duration: 1.4, ease: 'back.out(1.5)' },
          at + 0.55,
        );
    },
    { dependencies: [engine, fallback] },
  );

  return (
    <section
      ref={root}
      id="top"
      aria-label={site.name}
      className={`relative isolate h-[100svh] min-h-[600px] w-full select-none overflow-hidden ${fallback ? 'bg-paper' : 'bg-ink'}`}
    >
      {/* ---------- WebGL stage (parallax) ---------- */}
      <div ref={stage} className="absolute inset-0 will-change-transform">
        {!fallback && isMounted && (
          <InkCanvas
            lines={hero.lines}
            compactLines={hero.compactLines}
            fontFamily={DISPLAY_FONT}
            fontWeight={DISPLAY_WEIGHT}
            colors={{ paper: '#f3f5f4', ink: '#071a2b' }}
            lifetime={1.7}
            onReady={setEngine}
            onFallback={() => setFallback(true)}
          />
        )}

        {/* No-WebGL fallback: plain wordmark */}
        {fallback && (
          <div aria-hidden className="absolute inset-x-0 top-1/2 -translate-y-1/2 px-4 text-center font-display font-black uppercase leading-[0.86] tracking-[-0.04em] text-ink">
            <span className="hidden sm:block">
              <span className="block text-[9.4vw]">{hero.lines[0]}</span>
              <span className="block text-[17.5vw]">{hero.lines[1]}</span>
            </span>
            <span className="sm:hidden">
              {hero.compactLines.map((l) => (
                <span key={l} className="block text-[18vw]">{l}</span>
              ))}
            </span>
          </div>
        )}
      </div>

      <h1 className="sr-only">
        {site.name} — {hero.tagline.join(' ')}
      </h1>

      {/* ---------- Left vertical badge (desktop) ---------- */}
      <p
        data-fx="bottom"
        data-scroll="fade"
        className="pointer-events-none absolute left-3 top-1/2 hidden -translate-y-1/2 rotate-180 font-mono text-[10px] uppercase tracking-[0.22em] text-white mix-blend-difference [writing-mode:vertical-rl] lg:block"
      >
        <span className="mb-2 inline-block size-1.5 animate-pulse rounded-full bg-current" /> {hero.badge}
      </p>

      {/* ---------- UI overlay (no z-index on purpose — keeps blending with the canvas) ---------- */}
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between px-4 pb-4 pt-[76px] sm:px-6 sm:pb-6 sm:pt-24 lg:px-10 lg:pb-8 lg:pt-28">
        {/* Top: tagline + CTAs */}
        <div className="max-w-xl">
          <p className="text-[clamp(18px,1.7vw,26px)] font-medium leading-[1.12] tracking-[-0.03em]">
            {hero.tagline.map((line) => (
              <span key={line} className="block overflow-hidden pb-[0.08em]">
                <span data-fx="line" data-scroll="fade" className="block text-white mix-blend-difference">
                  {line}
                </span>
              </span>
            ))}
          </p>

          {/* <div className="mt-5 flex flex-wrap items-center gap-3 sm:mt-7">
            <a
              data-fx="cta"
              data-scroll="fade"
              href={primaryHref}
              {...(/^https?:/.test(primaryHref) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="pointer-events-auto group/cta inline-flex items-center gap-3 rounded-full bg-emerald px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.14em] text-ink shadow-[0_12px_40px_-12px] shadow-emerald/70 transition-[gap,background-color] duration-300 hover:gap-4 hover:bg-emerald-soft"
            >
              {hero.primaryCta}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </a>
            <a
              data-fx="cta"
              data-scroll="fade"
              href={hero.secondaryHref}
              className="pointer-events-auto inline-flex items-center rounded-full border border-current px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white mix-blend-difference transition-opacity hover:opacity-70"
            >
              {hero.secondaryCta}
            </a>
          </div> */}
        </div>

        {/* Bottom bar */}
        <div className="flex items-end justify-between gap-4">
          <p data-fx="bottom" data-scroll="fade" className="max-w-[16rem] text-[12px] font-medium leading-snug text-white mix-blend-difference sm:max-w-xs sm:text-[13px]">
            {hero.caption}
          </p>

          <div data-fx="bottom" data-scroll="fade" className="hidden flex-col items-center gap-2 text-white mix-blend-difference md:flex" aria-hidden>
            <span className="font-mono text-[10px] uppercase tracking-[0.24em]">Scroll</span>
            <span className="relative block h-10 w-px overflow-hidden bg-current/30">
              <span className="absolute inset-x-0 top-0 h-1/2 animate-[scrollcue_1.8s_ease-in-out_infinite] bg-current" />
            </span>
          </div>

          <div className="flex items-end gap-5 sm:gap-7">
            <nav aria-label="Social" className="hidden items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.12em] sm:flex">
              {site.socials.map((s, i) => (
                <span key={s.label} className="flex items-center gap-3">
                  {i > 0 && (
                    <span data-fx="bottom" data-scroll="fade" aria-hidden className="text-white mix-blend-difference">
                      /
                    </span>
                  )}
                  <a
                    data-fx="bottom"
                    data-scroll="fade"
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pointer-events-auto text-white mix-blend-difference transition-opacity hover:opacity-60"
                  >
                    {s.label}
                  </a>
                </span>
              ))}
            </nav>
            <div data-fx="badge" data-scroll="fade" className="pointer-events-auto">
              <RotatingBadge href={primaryHref} text={hero.ring} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
