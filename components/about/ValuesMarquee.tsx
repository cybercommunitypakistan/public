// =============================================================================
// FILE: components/about/ValuesMarquee.tsx
// Infinite values strip. Drifts slowly on its own; scrolling speeds it up and
// flips its direction with the scroll direction (GSAP + ScrollTrigger).
// =============================================================================

'use client';

import { useRef } from 'react';
import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion } from '@/lib/gsap';

type Props = { items: readonly string[]; className?: string };

function Row({ items }: { items: readonly string[] }) {
  return (
    <div className="flex shrink-0 items-center" aria-hidden>
      {items.map((w, i) => (
        <span key={`${w}-${i}`} className="flex items-center">
          <span className={`px-5 font-display text-[clamp(34px,5.5vw,84px)] font-black uppercase leading-none tracking-[-0.035em] sm:px-8 ${i % 2 ? 'text-transparent [-webkit-text-stroke:1.5px_rgb(243_245_244/0.55)]' : 'text-paper'}`}>
            {w}
          </span>
          <svg viewBox="0 0 24 24" className="size-[clamp(18px,2vw,30px)] shrink-0 fill-emerald" aria-hidden>
            <path d="M12 0c.6 6.4 5.6 11.4 12 12-6.4.6-11.4 5.6-12 12-.6-6.4-5.6-11.4-12-12C6.4 11.4 11.4 6.4 12 0Z" />
          </svg>
        </span>
      ))}
    </div>
  );
}

export default function ValuesMarquee({ items, className = '' }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      // two identical rows → move by -50% and loop seamlessly
      const loop = gsap.to(track.current, { xPercent: -50, duration: 38, ease: 'none', repeat: -1 });
      loop.totalTime(38 * 100); // headroom so reverse direction never hits time 0
      let dir = 1;
      const st = ScrollTrigger.create({
        trigger: root.current,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: (self) => {
          const v = self.getVelocity();
          dir = self.direction;
          const speed = Math.min(6, 1 + Math.abs(v) / 300);
          gsap.to(loop, { timeScale: speed * dir, duration: 0.25, overwrite: true });
          gsap.to(loop, { timeScale: dir, duration: 1.2, delay: 0.25, ease: 'power2.out' });
        },
      });
      return () => st.kill();
    },
    { scope: root },
  );

  return (
    <div ref={root} className={`relative overflow-hidden ${className}`}>
      <p className="sr-only">{items.join(', ')}</p>
      <div ref={track} className="flex w-max will-change-transform">
        <Row items={items} />
        <Row items={items} />
      </div>
    </div>
  );
}
