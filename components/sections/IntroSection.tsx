// =============================================================================
// FILE: components/sections/IntroSection.tsx
// Content: database → Section 'about.intro' (props).
// Section right after the hero. Navy background so the hero's rising ink
// flows straight into it. The statement lights up word by word on scroll and
// the cards rise in (GSAP ScrollTrigger, smoothed by Lenis).
// =============================================================================

'use client';

import { useRef } from 'react';
import { gsap, useGSAP, prefersReducedMotion } from '@/lib/gsap';
import type { SectionContent } from '@/lib/content/schemas';
import { useSite } from '@/components/providers/SiteProvider';

export default function IntroSection({ data }: { data: SectionContent<'about.intro'> }) {
  const site = useSite();
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.fromTo(
        '[data-word]',
        { opacity: 0.14 },
        {
          opacity: 1,
          ease: 'none',
          stagger: 0.1,
          scrollTrigger: { trigger: '[data-statement]', start: 'top 80%', end: 'bottom 45%', scrub: true },
        },
      );
      gsap.from('[data-card]', {
        y: 80,
        opacity: 0,
        duration: 1.2,
        ease: 'expo.out',
        stagger: 0.12,
        scrollTrigger: { trigger: '[data-cards]', start: 'top 85%' },
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="about" className="relative bg-ink px-4 pb-24 pt-20 text-paper sm:px-6 sm:pb-32 sm:pt-28 lg:px-10 lg:pb-40">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-emerald">// {data.eyebrow}</p>

      <h2 data-statement className="mt-6 max-w-6xl font-display text-[clamp(28px,4.6vw,72px)] font-extrabold leading-[1.02] tracking-[-0.035em]">
        {data.statement.split(' ').map((w, i) => (
          <span key={i} data-word className="inline-block pr-[0.25em]">
            {w}
          </span>
        ))}
      </h2>

      <div data-cards className="mt-16 grid gap-4 sm:mt-24 md:grid-cols-3 lg:gap-6">
        {data.cards.map((c) => {
          const href = c.ctaHref || site.applyUrl;
          return (
          <article
            key={c.anchor}
            id={c.anchor}
            data-card
            className={`group flex min-h-[300px] scroll-mt-24 flex-col justify-between rounded-3xl border p-6 transition-colors duration-500 sm:p-8 ${
              c.highlight
                ? 'border-emerald bg-emerald text-ink'
                : 'border-white/10 bg-white/[0.03] hover:border-emerald/60 hover:bg-white/[0.06]'
            }`}
          >
            <div>
              <p className={`font-mono text-[11px] uppercase tracking-[0.2em] ${c.highlight ? 'text-ink/70' : 'text-emerald'}`}>{c.tag}</p>
              <h3 className="mt-5 font-display text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">{c.title}</h3>
              <p className={`mt-4 text-[15px] leading-relaxed ${c.highlight ? 'text-ink/80' : 'text-paper/70'}`}>{c.body}</p>
            </div>
            <a
              href={href}
              {...(href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="mt-8 inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.14em] transition-[gap] duration-300 hover:gap-3"
            >
              {c.ctaLabel}
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </a>
          </article>
          );
        })}
      </div>

      <div className="mt-20 flex flex-col gap-4 border-t border-white/10 pt-8 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-paper/60">{data.contactLabel}</p>
        <a href={`mailto:${site.email}`} className="font-semibold text-emerald hover:underline">
          {site.email}
        </a>
      </div>
    </section>
  );
}
