// =============================================================================
// FILE: components/home/Testimonials.tsx
// Home section 8 — Voices from the community.
//   - Drag (mouse or touch) to throw the cards; momentum + bounds via GSAP
//     Draggable + InertiaPlugin. Cards skew slightly with drag speed.
//   - A round "DRAG" cursor follows the mouse over the track (desktop).
//   - Prev/next buttons for keyboard users.
// Content: database → Testimonial rows + Section 'home.testimonials' (props)
// Rows marked as sample show a small "Sample" tag.
// =============================================================================

'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { Draggable } from 'gsap/Draggable';
import { InertiaPlugin } from 'gsap/InertiaPlugin';
import { gsap, useGSAP, prefersReducedMotion } from '@/lib/gsap';
import type { SectionContent } from '@/lib/content/schemas';
import type { Testimonial } from '@/lib/content/types';
import { Icon } from './icons';

if (typeof window !== 'undefined') gsap.registerPlugin(Draggable, InertiaPlugin);

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

type Props = { intro: SectionContent<'home.testimonials'>; testimonials: Testimonial[] };

export default function Testimonials({ intro: testimonialsIntro, testimonials }: Props) {
  const root = useRef<HTMLElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const cursor = useRef<HTMLDivElement>(null);
  const drag = useRef<Draggable | null>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const reduce = prefersReducedMotion();
      const cards = q('[data-t-card]');

      if (!reduce) {
        gsap.fromTo(q('[data-t-word]'), { yPercent: 110 }, { yPercent: 0, duration: 1.2, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: root.current, start: 'top 75%' } });
        gsap.fromTo(q('[data-t-fade]'), { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: root.current, start: 'top 75%' } });
        gsap.fromTo(cards, { autoAlpha: 0, x: 120 }, { autoAlpha: 1, x: 0, duration: 1.3, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: viewport.current, start: 'top 85%' } });
      }

      const skewTo = gsap.quickTo(cards, 'skewX', { duration: 0.4, ease: 'power3.out' });
      // skew from how far the track moved since the last frame (drag + throw)
      let lastX = 0;
      const skewFromMotion = () => {
        if (reduce) return;
        const x = gsap.getProperty(track.current!, 'x') as number;
        skewTo(gsap.utils.clamp(-8, 8, (lastX - x) * 0.25));
        lastX = x;
      };

      drag.current = Draggable.create(track.current, {
        type: 'x',
        bounds: viewport.current,
        inertia: true,
        edgeResistance: 0.85,
        dragClickables: true,
        zIndexBoost: false,
        onPress() {
          lastX = gsap.getProperty(track.current!, 'x') as number;
          gsap.to(cursor.current, { scale: 0.8, duration: 0.3 });
        },
        onRelease() {
          gsap.to(cursor.current, { scale: 1, duration: 0.4, ease: 'back.out(2)' });
        },
        onDrag: skewFromMotion,
        onThrowUpdate: skewFromMotion,
        onThrowComplete() {
          skewTo(0);
        },
        onDragEnd() {
          skewTo(0);
        },
      })[0];

      const onResize = () => drag.current?.applyBounds(viewport.current!);
      window.addEventListener('resize', onResize);
      return () => {
        window.removeEventListener('resize', onResize);
        drag.current?.kill();
      };
    },
    { scope: root },
  );

  // ---- drag cursor (mouse only) ----
  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse' || !cursor.current || !viewport.current) return;
    const r = viewport.current.getBoundingClientRect();
    gsap.to(cursor.current, { x: e.clientX - r.left, y: e.clientY - r.top, duration: 0.45, ease: 'power3.out' });
  };
  const showCursor = (show: boolean) => (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    gsap.to(cursor.current, { autoAlpha: show ? 1 : 0, scale: show ? 1 : 0.4, duration: 0.35, ease: 'power3.out' });
  };

  // ---- buttons ----
  const step = (dir: 1 | -1) => {
    const d = drag.current;
    const t = track.current;
    const v = viewport.current;
    if (!d || !t || !v) return;
    const card = t.querySelector<HTMLElement>('[data-t-card]');
    const amount = (card?.offsetWidth ?? 360) + 20;
    const min = Math.min(0, v.clientWidth - t.scrollWidth);
    const x = gsap.utils.clamp(min, 0, (gsap.getProperty(t, 'x') as number) - dir * amount);
    gsap.to(t, { x, duration: 0.9, ease: 'expo.out', onUpdate: () => d.update() });
  };

  return (
    <section ref={root} id="voices" aria-labelledby="voices-title" className="relative overflow-hidden bg-ink py-24 text-paper sm:py-32">
      {/* Header */}
      <div className="flex flex-col gap-6 px-4 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-10">
        <div className="relative">
          <Icon.quote className="absolute -left-2 -top-10 size-24 text-emerald/15 sm:size-32 lg:-top-14" />
          <p data-t-fade className="relative font-mono text-[11px] uppercase tracking-[0.22em] text-emerald">
            // {testimonialsIntro.eyebrow}
          </p>
          <h2 id="voices-title" className="relative mt-4 font-display text-[clamp(44px,7vw,112px)] font-black uppercase leading-[0.88] tracking-[-0.05em]">
            {testimonialsIntro.title.split(' ').reduce<string[][]>((acc, w, i) => {
              // two lines: "From our" / "community"
              (acc[i < 2 ? 0 : 1] ??= []).push(w);
              return acc;
            }, []).map((line, i) => (
              <span key={i} className="block overflow-hidden pb-[0.04em]">
                <span data-t-word className="block">
                  {line.join(' ')}
                </span>
              </span>
            ))}
          </h2>
        </div>

        <div data-t-fade className="flex items-center gap-3">
          <span className="mr-2 hidden font-mono text-[11px] uppercase tracking-[0.18em] text-paper/45 sm:inline">Drag or use arrows</span>
          {([-1, 1] as const).map((dir) => (
            <button
              key={dir}
              type="button"
              onClick={() => step(dir)}
              aria-label={dir === -1 ? 'Previous' : 'Next'}
              className="grid size-12 place-items-center rounded-full border border-white/15 transition-colors hover:border-emerald hover:bg-emerald hover:text-ink sm:size-14"
            >
              <Icon.arrow className={`size-5 ${dir === -1 ? 'rotate-180' : ''}`} />
            </button>
          ))}
        </div>
      </div>

      {/* Track */}
      <div
        ref={viewport}
        className="relative mt-14 cursor-none px-4 sm:mt-16 sm:px-6 lg:px-10 [@media(hover:none)]:cursor-auto"
        onPointerMove={onMove}
        onPointerEnter={showCursor(true)}
        onPointerLeave={showCursor(false)}
      >
        <div ref={track} className="flex w-max gap-4 will-change-transform sm:gap-5">
          {testimonials.map((t, i) => (
            <figure
              key={i}
              data-t-card
              className={`relative flex w-[82vw] max-w-[420px] shrink-0 select-none flex-col justify-between rounded-[28px] border p-6 sm:w-[400px] sm:p-8 ${
                i % 3 === 1 ? 'border-emerald bg-emerald text-ink' : 'border-white/10 bg-ink-2/50'
              }`}
              style={{ minHeight: 340 }}
            >
              <Icon.quote className={`size-10 ${i % 3 === 1 ? 'text-ink/30' : 'text-emerald/60'}`} />
              <blockquote className="mt-6 text-[19px] font-medium leading-[1.35] tracking-[-0.02em] sm:text-[22px]">{t.quote}</blockquote>
              <figcaption className="mt-8 flex items-center gap-3">
                {t.avatarUrl ? (
                  <Image 
                    src={t.avatarUrl} 
                    alt={`${t.name}'s avatar`} 
                    width={44} 
                    height={44}
                    className="size-11 shrink-0 rounded-full object-cover" 
                    draggable={false}
                    loading="lazy"
                  />
                ) : (
                  <span className={`grid size-11 shrink-0 place-items-center rounded-full font-display text-sm font-black ${i % 3 === 1 ? 'bg-ink text-emerald' : 'bg-emerald/15 text-emerald'}`}>
                    {initials(t.name)}
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block font-semibold">{t.name}</span>
                  <span className={`block text-[13px] ${i % 3 === 1 ? 'text-ink/70' : 'text-paper/55'}`}>{t.role}</span>
                </span>
                {t.placeholder && (
                  <span className={`ml-auto rounded-full border px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.14em] ${i % 3 === 1 ? 'border-ink/30 text-ink/60' : 'border-white/20 text-paper/45'}`}>
                    Sample
                  </span>
                )}
              </figcaption>
            </figure>
          ))}
        </div>

        {/* drag cursor */}
        <div
          ref={cursor}
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 z-10 -ml-11 -mt-11 hidden size-22 place-items-center rounded-full bg-paper font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-ink opacity-0 lg:grid"
        >
          Drag
        </div>
      </div>
    </section>
  );
}
