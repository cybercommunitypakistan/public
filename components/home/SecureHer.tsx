// =============================================================================
// FILE: components/home/SecureHer.tsx
// Home section 5 — SecureHer. Its own rose accent inside a rounded panel:
//   left: title, story, three points, CTA
//   right: shield emblem with a rotating text ring, pulsing rings and floating
//          chips that drift at different speeds as you scroll (parallax)
// Content: database → Section 'home.secureher' (props)
// =============================================================================

'use client';

import { useRef } from 'react';
import { gsap, useGSAP, prefersReducedMotion } from '@/lib/gsap';
import type { SectionContent } from '@/lib/content/schemas';
import { Icon } from './icons';

// chip positions around the emblem (percent of the visual box)
const CHIP_POS = [
  { left: '4%', top: '16%', speed: -60 },
  { left: '62%', top: '8%', speed: 40 },
  { left: '0%', top: '70%', speed: 50 },
  { left: '58%', top: '80%', speed: -40 },
];

export default function SecureHer({ secureHer }: { secureHer: SectionContent<'home.secureher'> }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const q = gsap.utils.selector(root);
      const st = { trigger: root.current, start: 'top 72%' };

      gsap.fromTo(q('[data-s-panel]'), { clipPath: 'inset(12% 6% 12% 6% round 40px)' }, { clipPath: 'inset(0% 0% 0% 0% round 40px)', ease: 'none', scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'top 25%', scrub: true } });
      gsap.fromTo(q('[data-s-word]'), { yPercent: 110 }, { yPercent: 0, duration: 1.3, ease: 'expo.out', stagger: 0.1, scrollTrigger: st });
      gsap.fromTo(q('[data-s-fade]'), { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.08, scrollTrigger: st });
      gsap.fromTo(q('[data-s-emblem]'), { scale: 0.6, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 1.4, ease: 'back.out(1.4)', scrollTrigger: st });

      q('[data-s-chip]').forEach((el, i) => {
        gsap.to(el, {
          y: CHIP_POS[i % CHIP_POS.length].speed,
          ease: 'none',
          scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: true },
        });
      });
      gsap.to(q('[data-s-ring]'), { rotate: 240, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: true } });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="secureher" aria-labelledby="secureher-title" className="relative bg-ink px-3 py-16 text-paper sm:px-5 sm:py-24 lg:px-8">
      <div data-s-panel className="relative overflow-hidden rounded-[32px] border border-rose/15 bg-gradient-to-br from-[#1b1430] via-ink-2 to-ink sm:rounded-[40px]">
        {/* glows */}
        <div aria-hidden className="pointer-events-none absolute -right-32 -top-32 size-[560px] rounded-full bg-rose/20 blur-[140px]" />
        <div aria-hidden className="pointer-events-none absolute -bottom-40 left-1/4 size-[420px] rounded-full bg-emerald/10 blur-[130px]" />

        <div className="relative grid items-center gap-12 px-5 py-14 sm:px-10 sm:py-20 lg:grid-cols-12 lg:gap-8 lg:px-14 lg:py-24">
          {/* ---------- Visual ---------- */}
          <div className="relative order-first mx-auto aspect-square w-full max-w-[460px] lg:order-last lg:col-span-5 lg:col-start-8">
            {/* pulsing rings */}
            {[0, 1, 2].map((i) => (
              <span key={i} aria-hidden className="absolute left-1/2 top-1/2 size-[46%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-rose/40 animate-[ripple_3.6s_ease-out_infinite]" style={{ animationDelay: `${i * 1.2}s` }} />
            ))}

            <div data-s-emblem className="absolute left-1/2 top-1/2 size-[62%] -translate-x-1/2 -translate-y-1/2">
              {/* rotating text ring */}
              <svg data-s-ring viewBox="0 0 100 100" aria-hidden className="absolute inset-0 size-full text-rose">
                <defs>
                  <path id="sh-ring" d="M50,50 m-42,0 a42,42 0 1,1 84,0 a42,42 0 1,1 -84,0" />
                </defs>
                <text className="fill-current font-mono text-[7.4px] font-semibold uppercase tracking-[0.24em]">
                  <textPath href="#sh-ring">{secureHer.ring.repeat(2)}</textPath>
                </text>
              </svg>
              <span className="absolute inset-[22%] grid place-items-center rounded-full bg-rose text-ink shadow-[0_0_80px_-10px] shadow-rose">
                <Icon.shield className="size-1/2" />
              </span>
            </div>

            {/* floating chips */}
            {secureHer.chips.map((c, i) => (
              <span
                key={c}
                data-s-chip
                className="absolute"
                style={{ left: CHIP_POS[i % CHIP_POS.length].left, top: CHIP_POS[i % CHIP_POS.length].top }}
              >
                <span
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-ink/70 px-3.5 py-2 text-[12.5px] font-medium backdrop-blur-md animate-[float_5s_ease-in-out_infinite] sm:text-[13.5px]"
                  style={{ animationDelay: `${i * -1.3}s` }}
                >
                  <span className="size-1.5 rounded-full bg-rose" />
                  {c}
                </span>
              </span>
            ))}
          </div>

          {/* ---------- Text ---------- */}
          <div className="lg:col-span-6">
            <p data-s-fade className="font-mono text-[11px] uppercase tracking-[0.22em] text-rose">
              // {secureHer.eyebrow}
            </p>
            <h2 id="secureher-title" className="mt-4 font-display text-[clamp(56px,10vw,150px)] font-black uppercase leading-[0.85] tracking-[-0.055em]">
              <span className="inline-block overflow-hidden pb-[0.04em] align-top">
                <span data-s-word className="inline-block">
                  {secureHer.title[0]}
                </span>
              </span>
              <span className="inline-block overflow-hidden pb-[0.04em] align-top">
                <span data-s-word className="inline-block text-rose">
                  {secureHer.title[1]}
                </span>
              </span>
            </h2>
            <p data-s-fade className="mt-6 max-w-xl text-[16.5px] leading-relaxed text-paper/75 sm:text-lg">
              {secureHer.lead}
            </p>

            <ul className="mt-9 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-3">
              {secureHer.points.map((pt, i) => (
                <li key={pt.title} data-s-fade className="bg-ink/80 p-5 transition-colors duration-500 hover:bg-[#21162e]">
                  <span className="font-mono text-[11px] text-rose">{String(i + 1).padStart(2, '0')}</span>
                  <h3 className="mt-2 text-[17px] font-semibold tracking-[-0.01em]">{pt.title}</h3>
                  <p className="mt-1 text-[13.5px] leading-snug text-paper/60">{pt.body}</p>
                </li>
              ))}
            </ul>

            <a
              data-s-fade
              href={secureHer.ctaHref}
              {...(/^https?:/.test(secureHer.ctaHref) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="mt-9 inline-flex items-center gap-3 rounded-full bg-rose px-6 py-4 text-[11px] font-bold uppercase tracking-[0.14em] text-ink shadow-[0_14px_40px_-14px] shadow-rose transition-[gap,filter] duration-300 hover:gap-4 hover:brightness-110"
            >
              {secureHer.ctaLabel}
              <Icon.arrow className="size-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
