// =============================================================================
// FILE: components/home/Programs.tsx
// Home section 2 — Programs.
//   Desktop (≥1024px): the section pins and the cards slide sideways as you
//   scroll down (GSAP ScrollTrigger + Lenis); each card's art drifts with a
//   small parallax; a progress bar and counter follow along.
//   Phones/tablets: a native swipe carousel with snap points + progress bar.
// Content: database → Program rows + Section 'home.programs' (props)
// =============================================================================

'use client';

import { useRef } from 'react';
import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion } from '@/lib/gsap';
import type { SectionContent } from '@/lib/content/schemas';
import type { Program } from '@/lib/content/types';
import ProgramArt from './ProgramArt';
import { Icon } from './icons';

type Props = { intro: SectionContent<'home.programs'>; programs: Program[] };

export default function Programs({ intro: programsIntro, programs }: Props) {
  const root = useRef<HTMLElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const count = useRef<HTMLSpanElement>(null);

  const setProgress = (p: number) => {
    if (bar.current) bar.current.style.transform = `scaleX(${Math.max(0.04, p)})`;
    if (count.current) {
      const i = Math.min(programs.length, Math.max(1, Math.round(p * (programs.length - 1)) + 1));
      count.current.textContent = String(i).padStart(2, '0');
    }
  };

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const reduce = prefersReducedMotion();

      if (!reduce) {
        gsap.fromTo(q('[data-p-fade]'), { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: root.current, start: 'top 75%' } });
        gsap.fromTo(q('[data-p-word]'), { yPercent: 110 }, { yPercent: 0, duration: 1.2, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: root.current, start: 'top 75%' } });
      }

      const mm = gsap.matchMedia();

      // ---- desktop: pinned horizontal scroll ----
      mm.add('(min-width: 1024px)', () => {
        const t = track.current!;
        const distance = () => Math.max(0, t.scrollWidth - (viewport.current?.clientWidth ?? window.innerWidth));
        const tween = gsap.to(t, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: {
            trigger: root.current,
            start: 'top top',
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 0.8,
            invalidateOnRefresh: true,
            anticipatePin: 1,
            onUpdate: (self) => setProgress(self.progress),
          },
        });

        // art parallax inside each card, linked to the horizontal movement
        if (!reduce) {
          q('[data-p-art]').forEach((el) => {
            gsap.fromTo(el, { x: 60 }, { x: -60, ease: 'none', scrollTrigger: { trigger: el, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
          });
        }
        return () => gsap.set(t, { x: 0 });
      });

      // ---- mobile/tablet: native swipe ----
      mm.add('(max-width: 1023px)', () => {
        const v = viewport.current!;
        const onScroll = () => setProgress(v.scrollLeft / Math.max(1, v.scrollWidth - v.clientWidth));
        v.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
        return () => v.removeEventListener('scroll', onScroll);
      });

      ScrollTrigger.refresh();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="programs" aria-labelledby="programs-title" className="relative overflow-hidden bg-ink py-24 text-paper sm:py-28 lg:flex lg:h-[100svh] lg:flex-col lg:justify-center lg:py-0">
      {/* Header */}
      <div className="flex flex-col gap-6 px-4 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-10">
        <div>
          <p data-p-fade className="font-mono text-[11px] uppercase tracking-[0.22em] text-emerald">
            // {programsIntro.eyebrow}
          </p>
          <h2 id="programs-title" className="mt-4 font-display text-[clamp(44px,7vw,112px)] font-black uppercase leading-[0.88] tracking-[-0.05em]">
            {programsIntro.title.split(' ').map((w, i) => (
              <span key={i} className="mr-[0.22em] inline-block overflow-hidden pb-[0.04em] align-top last:mr-0">
                <span data-p-word className="inline-block">
                  {w}
                </span>
              </span>
            ))}
          </h2>
        </div>
        <div data-p-fade className="max-w-sm lg:pb-2">
          <p className="text-[15.5px] leading-relaxed text-paper/65">{programsIntro.body}</p>
          <div className="mt-5 flex items-center gap-4 font-mono text-[12px] text-paper/60">
            <span>
              <span ref={count} className="text-paper">
                01
              </span>{' '}
              / {String(programs.length).padStart(2, '0')}
            </span>
            <span className="relative h-[2px] flex-1 overflow-hidden rounded-full bg-white/10">
              <span ref={bar} className="absolute inset-0 origin-left scale-x-[0.04] rounded-full bg-emerald transition-transform duration-150" />
            </span>
          </div>
        </div>
      </div>

      {/* Track */}
      <div ref={viewport} className="no-scrollbar mt-10 snap-x snap-mandatory overflow-x-auto scroll-px-4 sm:scroll-px-6 lg:mt-14 lg:snap-none lg:overflow-visible" data-lenis-prevent-touch>
        <div ref={track} className="flex w-max gap-4 px-4 pb-2 sm:gap-5 sm:px-6 lg:gap-6 lg:px-10 lg:will-change-transform">
          {programs.map((p, i) => (
            <article
              key={p.title}
              className={`group/prog relative flex h-[520px] w-[84vw] max-w-[440px] shrink-0 snap-start flex-col overflow-hidden rounded-[28px] border p-6 transition-[border-color,transform] duration-500 hover:-translate-y-1.5 sm:w-[420px] sm:p-7 lg:h-[min(560px,62svh)] lg:w-[min(440px,34vw)] ${
                p.featured ? 'border-emerald bg-emerald text-ink' : 'border-white/10 bg-ink-2/40 hover:border-emerald/60'
              }`}
            >
              {/* top row */}
              <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.16em]">
                <span className={p.featured ? 'text-ink/70' : 'text-paper/50'}>{String(i + 1).padStart(2, '0')}</span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${
                    p.status === 'Coming soon'
                      ? p.featured
                        ? 'border border-ink/30'
                        : 'border border-white/20 text-paper/70'
                      : p.featured
                        ? 'bg-ink text-emerald'
                        : 'bg-emerald/15 text-emerald'
                  }`}
                >
                  {p.status !== 'Coming soon' && <span className="size-1.5 animate-pulse rounded-full bg-current" />}
                  {p.status}
                </span>
              </div>

              {/* art */}
              <div className="relative mt-5 flex h-[34%] items-center justify-center">
                <div data-p-art className="flex size-full items-center justify-center">
                  <ProgramArt art={p.art} featured={p.featured} />
                </div>
              </div>

              {/* text */}
              <div className="mt-auto">
                <p className={`font-mono text-[11px] uppercase tracking-[0.16em] ${p.featured ? 'text-ink/70' : 'text-emerald'}`}>{p.level}</p>
                <h3 className="mt-2 font-display text-[28px] font-extrabold leading-[1.02] tracking-[-0.035em] sm:text-[32px]">{p.title}</h3>
                <p className={`mt-3 text-[14.5px] leading-relaxed ${p.featured ? 'text-ink/80' : 'text-paper/65'}`}>{p.description}</p>
                <ul className="mt-4 flex flex-wrap gap-1.5">
                  {p.meta.map((m) => (
                    <li key={m} className={`rounded-full px-2.5 py-1 text-[11.5px] ${p.featured ? 'bg-ink/10 text-ink' : 'bg-white/[0.06] text-paper/75'}`}>
                      {m}
                    </li>
                  ))}
                </ul>
                <a
                  href={p.cta.href}
                  {...(p.cta.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className={`mt-6 inline-flex items-center gap-2 rounded-full px-5 py-3 text-[11px] font-bold uppercase tracking-[0.14em] transition-[gap,background-color] duration-300 hover:gap-3 ${
                    p.featured ? 'bg-ink text-paper hover:bg-ink-2' : 'border border-white/20 hover:border-emerald hover:text-emerald'
                  }`}
                >
                  {p.cta.label}
                  <Icon.arrow className="size-4" />
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
