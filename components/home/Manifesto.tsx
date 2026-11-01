// =============================================================================
// FILE: components/home/Manifesto.tsx
// Home section 1 — Manifesto. Navy (the hero's rising ink flows into it).
// One big statement that lights up word by word as you scroll; emerald icon
// chips sit inside the sentence and pop in; *highlighted* words turn emerald.
// Content: database → Section 'home.manifesto' (props from app/page.tsx)
// =============================================================================

'use client';

import { useRef } from 'react';
import { gsap, useGSAP, prefersReducedMotion } from '@/lib/gsap';
import type { SectionContent } from '@/lib/content/schemas';
import { Icon, type IconName } from './icons';

type Token = { kind: 'word'; text: string; hl: boolean } | { kind: 'icon'; name: IconName };

function parse(text: string): Token[] {
  return text.split(/\s+/).map((t) => {
    const icon = t.match(/^\[(\w+)\]$/);
    if (icon && icon[1] in Icon) return { kind: 'icon', name: icon[1] as IconName };
    const hl = /^\*.+\*[.,!?—]*$/.test(t);
    return { kind: 'word', text: t.replace(/\*/g, ''), hl };
  });
}

export default function Manifesto({ manifesto }: { manifesto: SectionContent<'home.manifesto'> }) {
  const root = useRef<HTMLElement>(null);
  const tokens = parse(manifesto.text);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const q = gsap.utils.selector(root);
      const st = { trigger: q('[data-m-text]')[0], start: 'top 78%', end: 'bottom 50%', scrub: true };

      gsap.fromTo(q('[data-m-word]'), { opacity: 0.12 }, { opacity: 1, ease: 'none', stagger: 0.1, scrollTrigger: st });
      gsap.fromTo(q('[data-m-hl]'), { color: 'rgb(243 245 244)' }, { color: '#14b87a', ease: 'none', stagger: 0.1, scrollTrigger: st });

      // icon chips pop in as their spot is reached
      q('[data-m-icon]').forEach((el) => {
        gsap.fromTo(
          el,
          { scale: 0, rotate: -90 },
          {
            scale: 1,
            rotate: 0,
            ease: 'back.out(2)',
            duration: 0.8,
            scrollTrigger: { trigger: el, start: 'top 72%', toggleActions: 'play none none reverse' },
          },
        );
      });

      gsap.fromTo(q('[data-m-fade]'), { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.1, scrollTrigger: { trigger: root.current, start: 'top 75%' } });

      // slow spin on the badge, tied to scroll
      gsap.to(q('[data-m-ring]'), { rotate: 180, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: true } });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="manifesto" aria-label="Our manifesto" className="relative overflow-hidden bg-ink px-4 py-28 text-paper sm:px-6 sm:py-36 lg:px-10 lg:py-44">
      {/* soft glow */}
      <div aria-hidden className="pointer-events-none absolute -left-40 top-10 size-[520px] rounded-full bg-emerald/10 blur-[140px]" />

      {/* rotating badge (desktop) */}
      <div aria-hidden data-m-ring className="absolute right-10 top-16 hidden size-32 lg:block xl:size-36">
        <svg viewBox="0 0 100 100" className="size-full text-paper/35">
          <defs>
            <path id="m-ring" d="M50,50 m-40,0 a40,40 0 1,1 80,0 a40,40 0 1,1 -80,0" />
          </defs>
          <text className="fill-current font-mono text-[8.5px] uppercase tracking-[0.2em]">
            <textPath href="#m-ring">MANIFESTO • CYBER COMMUNITY PAKISTAN •</textPath>
          </text>
        </svg>
        <span className="absolute inset-0 grid place-items-center text-emerald">
          <Icon.spark className="size-7" />
        </span>
      </div>

      <p data-m-fade className="relative font-mono text-[11px] uppercase tracking-[0.22em] text-emerald">
        // {manifesto.eyebrow}
      </p>

      <p
        data-m-text
        className="relative mt-8 max-w-[22ch] font-display text-[clamp(32px,5.2vw,86px)] font-extrabold leading-[1.04] tracking-[-0.04em] sm:mt-10 lg:max-w-[24ch]"
      >
        {tokens.map((t, i) =>
          t.kind === 'icon' ? (
            <span
              key={i}
              data-m-icon
              aria-hidden
              className="mx-[0.12em] inline-grid size-[0.95em] translate-y-[0.1em] place-items-center rounded-full border border-emerald/50 bg-emerald/15 align-baseline text-emerald shadow-[0_0_30px_-6px] shadow-emerald/60"
            >
              {(() => {
                const C = Icon[t.name];
                return <C className="size-[0.5em]" />;
              })()}
            </span>
          ) : (
            <span key={i}>
              <span data-m-word {...(t.hl ? { 'data-m-hl': '' } : {})} className="inline-block">
                {t.text}
              </span>{' '}
            </span>
          ),
        )}
      </p>

      <p data-m-fade className="relative mt-10 font-mono text-[12px] uppercase tracking-[0.18em] text-paper/50 sm:mt-14">
        {manifesto.signature}
      </p>
    </section>
  );
}
