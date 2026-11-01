// =============================================================================
// FILE: components/layout/ScrollIndicator.tsx
// Custom page scrollbar (the native one is hidden in globals.css).
//  - Thin emerald thumb on the right, synced with Lenis smooth scroll
//  - Shows while scrolling / hovering the right edge, fades out when idle
//  - Drag the thumb to scroll, click the track to jump
//  - Hidden when the page doesn't scroll and while the menu is open
// Must be rendered inside <SmoothScroll> (needs the Lenis context).
// =============================================================================

'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useLenis } from 'lenis/react';

const IDLE_MS = 1200;
const EDGE = 8; // px gap at top & bottom of the track

export default function ScrollIndicator() {
  const rail = useRef<HTMLDivElement>(null);
  const thumb = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<number>(0);
  const drag = useRef<{ startY: number; startScroll: number; ratio: number } | null>(null);
  const hovering = useRef(false);
  const lenisRef = useRef<ReturnType<typeof useLenis>>(undefined);

  // ---- position the thumb ----
  const update = useCallback(() => {
    const r = rail.current;
    const t = thumb.current;
    const lenis = lenisRef.current;
    if (!r || !t) return;

    const scroll = lenis ? lenis.scroll : window.scrollY;
    const limit = lenis ? lenis.limit : document.documentElement.scrollHeight - window.innerHeight;
    const viewH = window.innerHeight;

    if (limit <= 2) {
      r.dataset.hidden = 'true';
      return;
    }
    delete r.dataset.hidden;

    const trackH = r.clientHeight - EDGE * 2;
    const thumbH = Math.max(40, (viewH / (limit + viewH)) * trackH);
    const y = EDGE + (Math.min(Math.max(scroll, 0), limit) / limit) * (trackH - thumbH);
    t.style.height = `${thumbH}px`;
    t.style.transform = `translate3d(0, ${y}px, 0)`;
  }, []);

  // ---- show, then hide after idle ----
  const wake = useCallback(() => {
    const r = rail.current;
    if (!r) return;
    r.dataset.active = 'true';
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => {
      if (!drag.current && !hovering.current) delete r.dataset.active;
    }, IDLE_MS);
  }, []);

  const lenis = useLenis(() => {
    update();
    wake();
  });
  lenisRef.current = lenis;

  // ---- keep in sync with layout changes ----
  useEffect(() => {
    update();
    const ro = new ResizeObserver(update);
    ro.observe(document.body);
    window.addEventListener('resize', update);
    // fallback when Lenis is disabled (e.g. reduced motion)
    const onScroll = () => {
      if (!lenisRef.current) {
        update();
        wake();
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', onScroll);
      window.clearTimeout(hideTimer.current);
    };
  }, [update, wake]);

  useEffect(update, [lenis, update]);

  // ---- helpers ----
  const scrollTo = (value: number, immediate: boolean) => {
    if (lenis) lenis.scrollTo(value, { immediate, force: true });
    else window.scrollTo({ top: value, behavior: immediate ? 'auto' : 'smooth' });
  };
  const metrics = () => {
    const r = rail.current!;
    const t = thumb.current!;
    const limit = lenis ? lenis.limit : document.documentElement.scrollHeight - window.innerHeight;
    const trackH = r.clientHeight - EDGE * 2;
    const thumbH = t.offsetHeight;
    return { limit, trackH, thumbH, scroll: lenis ? lenis.scroll : window.scrollY };
  };

  // ---- drag the thumb ----
  const onThumbDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { limit, trackH, thumbH, scroll } = metrics();
    drag.current = { startY: e.clientY, startScroll: scroll, ratio: limit / Math.max(1, trackH - thumbH) };
    e.currentTarget.setPointerCapture(e.pointerId);
    rail.current!.dataset.dragging = 'true';
    document.documentElement.style.userSelect = 'none';
    wake();
  };
  const onThumbMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    scrollTo(d.startScroll + (e.clientY - d.startY) * d.ratio, true);
  };
  const onThumbUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    drag.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
    delete rail.current!.dataset.dragging;
    document.documentElement.style.userSelect = '';
    wake();
  };

  // ---- click the track to jump (thumb centres on the click) ----
  const onRailDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = rail.current!.getBoundingClientRect();
    const { limit, trackH, thumbH } = metrics();
    const y = e.clientY - r.top - EDGE - thumbH / 2;
    scrollTo((Math.min(Math.max(y, 0), trackH - thumbH) / Math.max(1, trackH - thumbH)) * limit, false);
  };

  return (
    <div
      ref={rail}
      aria-hidden
      onPointerDown={onRailDown}
      onPointerEnter={() => {
        hovering.current = true;
        wake();
      }}
      onPointerLeave={() => {
        hovering.current = false;
        wake();
      }}
      className="group/rail fixed inset-y-0 right-0 z-[55] w-4 cursor-pointer touch-none opacity-0 transition-opacity duration-500 data-[active]:opacity-100 data-[hidden]:pointer-events-none data-[hidden]:!opacity-0 in-[.lenis-stopped]:pointer-events-none in-[.lenis-stopped]:!opacity-0 max-md:pointer-events-none"
    >
      {/* track (visible on hover / drag) */}
      <div className="absolute bottom-2 right-1 top-2 w-[3px] rounded-full bg-emerald/15 opacity-0 transition-opacity duration-300 group-hover/rail:opacity-100 group-data-[dragging]/rail:opacity-100" />
      {/* thumb */}
      <div
        ref={thumb}
        onPointerDown={onThumbDown}
        onPointerMove={onThumbMove}
        onPointerUp={onThumbUp}
        onPointerCancel={onThumbUp}
        className="absolute right-1 top-0 w-[3px] cursor-grab rounded-full bg-emerald shadow-[0_0_12px] shadow-emerald/60 transition-[width,right] duration-200 will-change-transform group-hover/rail:right-[3px] group-hover/rail:w-[6px] group-data-[dragging]/rail:right-[3px] group-data-[dragging]/rail:w-[6px] group-data-[dragging]/rail:cursor-grabbing"
      />
    </div>
  );
}
