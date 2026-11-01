// =============================================================================
// FILE: components/about/AboutHero.tsx
// Hero for the /about page.
//   - Interactive emerald dot grid background (DotField)
//   - Big headline that rises word by word, with a cycling word in an
//     emerald pill (RotatingWord) — "We build [defenders]."
//   - Mission text + CTAs (left) and four value pillars (right)
//   - Scroll-reactive values marquee at the bottom (ValuesMarquee)
// Intro + scroll animations: GSAP. Content: database → Section 'about.hero' (props).
// =============================================================================

'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { gsap, useGSAP, prefersReducedMotion } from '@/lib/gsap';
import { useSite } from '@/components/providers/SiteProvider';
import type { SectionContent } from '@/lib/content/schemas';
import DotField from './DotField';
import RotatingWord from './RotatingWord';
import ValuesMarquee from './ValuesMarquee';


function ArrowRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export default function AboutHero({ about }: { about: SectionContent<'about.hero'> }) {
  const site = useSite();
  const root = useRef<HTMLElement>(null);
  const headline = useRef<HTMLHeadingElement>(null);
  const [rotate, setRotate] = useState(false);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      // header lives outside this section → query the document directly
      // (selector strings inside useGSAP are scoped to `root`)
      const header = Array.from(document.querySelectorAll<HTMLElement>('[data-fx="header"]'));

      if (prefersReducedMotion()) {
        gsap.set([...header, ...q('[data-fx]')], { autoAlpha: 1 });
        return;
      }

      const tl = gsap.timeline({ defaults: { ease: 'expo.out' }, onComplete: () => setRotate(true) });
      tl.fromTo(q('[data-fx="dots"]'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.6, ease: 'power2.out' }, 0)
        .fromTo(header, { autoAlpha: 0, yPercent: -80 }, { autoAlpha: 1, yPercent: 0, duration: 1.1, stagger: 0.05 }, 0.1)
        .fromTo(q('[data-fx="eyebrow"]'), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.06 }, 0.2)
        .fromTo(q('[data-fx="word"]'), { autoAlpha: 1, yPercent: 115 }, { yPercent: 0, duration: 1.25, stagger: 0.045 }, 0.25)
        .fromTo(
          q('[data-fx="pill"]'),
          { autoAlpha: 0, scale: 0.3, transformOrigin: '0% 60%' },
          { autoAlpha: 1, scale: 1, duration: 1.1, ease: 'back.out(1.6)' },
          0.85,
        )
        .fromTo(q('[data-fx="fade"]'), { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.07 }, 0.9);

      // scroll out: headline drifts up & dims, dots fade
      const st = { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true };
      gsap.to(headline.current, { y: -80, opacity: 0.25, ease: 'none', scrollTrigger: st });
      gsap.to(q('[data-scroll="dots"]'), { opacity: 0, ease: 'none', scrollTrigger: { ...st, end: '70% top' } });
    },
    { scope: root },
  );

  // headline → words; `{rotate}` becomes the pill
  const renderLine = (line: string, li: number) =>
    line.split(' ').map((token, wi) => {
      const key = `${li}-${wi}`;
      const space = wi > 0 ? ' ' : '';
      if (token.includes('{rotate}')) {
        const [before, after] = token.split('{rotate}');
        return (
          <span key={key}>
            {space}
            {/* pill + punctuation never split; on phones they get their own line so
                changing word lengths don't make the headline jump */}
            <span className="whitespace-nowrap max-sm:mt-1 max-sm:block">
              {before}
              <span data-fx="pill" className="inline-block">
                <RotatingWord words={about.rotatingWords} play={rotate} />
              </span>
              {after && (
                <span className="inline-block overflow-hidden pb-[0.08em] align-top">
                  <span data-fx="word" className="inline-block">
                    {after}
                  </span>
                </span>
              )}
            </span>
          </span>
        );
      }
      return (
        <span key={key}>
          {space}
          <span className="inline-block overflow-hidden pb-[0.08em] align-top">
            <span data-fx="word" className="inline-block">
              {token}
            </span>
          </span>
        </span>
      );
    });

  return (
    <section ref={root} aria-labelledby="about-title" className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-ink text-paper">
      {/* ---------- Background ---------- */}
      <div data-fx="dots" data-scroll="dots" className="absolute inset-0">
        <DotField />
      </div>
      <div aria-hidden className="pointer-events-none absolute -right-48 -top-48 size-[640px] rounded-full bg-emerald/20 blur-[150px]" />
      <div aria-hidden className="pointer-events-none absolute -bottom-40 -left-40 size-[420px] rounded-full bg-emerald/10 blur-[130px]" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-ink via-ink/70 to-transparent" />

      {/* ---------- Content ---------- */}
      <div className="relative flex flex-1 flex-col px-4 pt-24 sm:px-6 sm:pt-28 lg:px-10 lg:pt-28">
        <div className="flex items-center justify-between gap-4">
          <p data-fx="eyebrow" className="font-mono text-[11px] uppercase tracking-[0.22em] text-emerald">
            // {about.eyebrow}
          </p>
          <nav aria-label="Breadcrumb" data-fx="eyebrow" className="font-mono text-[11px] uppercase tracking-[0.18em] text-paper/45">
            <Link href="/" className="transition-colors hover:text-emerald">
              Home
            </Link>
            <span className="mx-2" aria-hidden>
              /
            </span>
            <span aria-current="page" className="text-paper">
              About
            </span>
          </nav>
        </div>

        <h1
          ref={headline}
          id="about-title"
          className="mt-8 font-display text-[clamp(40px,6.6vw,112px)] font-extrabold leading-[0.98] tracking-[-0.045em] will-change-transform sm:mt-10"
        >
          {about.headline.map((line, li) => (
            <span key={li} className="block">
              {renderLine(line, li)}
            </span>
          ))}
        </h1>

        <div className="mt-auto grid gap-12 pb-10 pt-12 lg:grid-cols-12 lg:gap-8 lg:pb-10 lg:pt-10">
          {/* Mission + CTAs */}
          <div className="lg:col-span-5">
            <p data-fx="fade" className="max-w-xl text-[16px] leading-relaxed text-paper/70 sm:text-[17px]">
              {about.mission}
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a
                data-fx="fade"
                href={site.applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group/cta inline-flex items-center gap-3 rounded-full bg-emerald px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.14em] text-ink shadow-[0_12px_40px_-12px] shadow-emerald/70 transition-[gap,background-color] duration-300 hover:gap-4 hover:bg-emerald-soft"
              >
                {about.primaryCta}
                <ArrowRight />
              </a>
              <Link
                data-fx="fade"
                href={about.secondaryCta.href}
                className="inline-flex items-center rounded-full border border-white/25 px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors hover:border-emerald hover:text-emerald"
              >
                {about.secondaryCta.label}
              </Link>
            </div>
          </div>

          {/* Pillars */}
          <ul className="grid grid-cols-2 gap-x-5 gap-y-8 sm:gap-x-8 lg:col-span-6 lg:col-start-7 lg:self-end">
            {about.pillars.map((p, i) => (
              <li key={p.title} data-fx="fade" className="group border-t border-white/12 pt-4 transition-colors hover:border-emerald">
                <span className="font-mono text-[11px] text-emerald">{String(i + 1).padStart(2, '0')}</span>
                <h2 className="mt-2 text-[17px] font-semibold tracking-[-0.01em] sm:text-lg">{p.title}</h2>
                <p className="mt-1 text-[13.5px] leading-snug text-paper/55 sm:text-sm">{p.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ---------- Values marquee ---------- */}
      <div data-fx="fade" className="relative border-y border-white/10 bg-ink/60 py-5 backdrop-blur-sm sm:py-7">
        <ValuesMarquee items={about.marquee} />
      </div>
    </section>
  );
}
