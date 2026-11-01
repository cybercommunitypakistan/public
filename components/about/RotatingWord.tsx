// =============================================================================
// FILE: components/about/RotatingWord.tsx
// Emerald pill inside a headline that cycles through words.
// The pill smoothly resizes to each word; words roll up like a counter.
// =============================================================================

'use client';

import { useEffect, useRef } from 'react';
import { gsap, prefersReducedMotion } from '@/lib/gsap';

type Props = {
  words: readonly string[];
  /** Seconds each word stays (default 2.2) */
  hold?: number;
  /** Start cycling (e.g. after the intro animation) */
  play?: boolean;
  className?: string;
};

export default function RotatingWord({ words, hold = 2.2, play = true, className = '' }: Props) {
  const pill = useRef<HTMLSpanElement>(null);
  const items = useRef<HTMLSpanElement[]>([]);
  const index = useRef(0);

  // width of the pill for word i (word width + horizontal padding)
  const widthFor = (i: number) => {
    const el = pill.current;
    const w = items.current[i];
    if (!el || !w) return 0;
    const cs = getComputedStyle(el);
    return w.offsetWidth + parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
  };

  // initial layout + keep width correct when the font size changes
  useEffect(() => {
    const el = pill.current;
    if (!el) return;
    items.current.forEach((w, i) => gsap.set(w, { yPercent: i === index.current ? 0 : 110 }));
    const fit = () => gsap.set(el, { width: widthFor(index.current) });
    fit();
    document.fonts?.ready.then(fit);
    const ro = new ResizeObserver(fit);
    ro.observe(el.parentElement ?? el);
    return () => ro.disconnect();
  }, [words]);

  // cycle
  useEffect(() => {
    if (!play || words.length < 2 || prefersReducedMotion()) return;
    let call: gsap.core.Tween;

    const next = () => {
      const cur = index.current;
      const nxt = (cur + 1) % words.length;
      const tl = gsap.timeline({ defaults: { duration: 0.75, ease: 'expo.inOut' } });
      tl.to(items.current[cur], { yPercent: -110 }, 0)
        .fromTo(items.current[nxt], { yPercent: 110 }, { yPercent: 0 }, 0.05)
        .to(pill.current, { width: widthFor(nxt), duration: 0.8 }, 0);
      index.current = nxt;
      call = gsap.delayedCall(hold, next);
    };
    call = gsap.delayedCall(hold, next);
    return () => {
      call?.kill();
    };
  }, [play, words, hold]);

  return (
    <span
      ref={pill}
      className={`relative inline-grid h-[1.02em] translate-y-[0.06em] items-center overflow-hidden rounded-full bg-emerald px-[0.3em] align-baseline text-ink ${className}`}
    >
      <span className="sr-only">{words[0]}</span>
      {words.map((w, i) => (
        <span
          key={w}
          aria-hidden
          ref={(el) => {
            if (el) items.current[i] = el;
          }}
          className="col-start-1 row-start-1 justify-self-start whitespace-nowrap leading-none will-change-transform"
        >
          {w}
        </span>
      ))}
    </span>
  );
}
