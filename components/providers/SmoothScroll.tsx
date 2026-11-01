// =============================================================================
// FILE: components/providers/SmoothScroll.tsx
// Lenis smooth scrolling, driven by GSAP's ticker so ScrollTrigger and Lenis
// stay in perfect sync. Wrap the app with it in app/layout.tsx.
// Use `useLenis()` from 'lenis/react' anywhere to scrollTo / stop / start.
// =============================================================================

'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { ReactLenis, useLenis, type LenisRef } from 'lenis/react';
import { gsap, ScrollTrigger, prefersReducedMotion } from '@/lib/gsap';

function ScrollTriggerSync() {
  useLenis(() => ScrollTrigger.update());
  return null;
}

/** On page change: start at the top (or at #hash) and re-measure ScrollTriggers. */
function RouteSync() {
  const pathname = usePathname();
  const lenis = useLenis();
  const first = useRef(true);

  useEffect(() => {
    if (!lenis) return;
    if (first.current) {
      first.current = false;
      return;
    }
    lenis.start();
    lenis.scrollTo(0, { immediate: true, force: true });
    const hash = window.location.hash;
    const id = window.setTimeout(() => {
      ScrollTrigger.refresh();
      if (hash && document.querySelector(hash)) lenis.scrollTo(hash, { duration: 1.4, force: true });
    }, 120);
    return () => window.clearTimeout(id);
  }, [pathname, lenis]);

  return null;
}

export default function SmoothScroll({ children }: { children: ReactNode }) {
  const lenisRef = useRef<LenisRef>(null);

  useEffect(() => {
    const update = (time: number) => lenisRef.current?.lenis?.raf(time * 1000);
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);
    if (prefersReducedMotion()) lenisRef.current?.lenis?.options && (lenisRef.current.lenis.options.lerp = 1);
    return () => gsap.ticker.remove(update);
  }, []);

  return (
    <ReactLenis
      root
      ref={lenisRef}
      options={{ autoRaf: false, lerp: 0.09, smoothWheel: true, anchors: { offset: 0 } }}
    >
      <ScrollTriggerSync />
      <RouteSync />
      {children}
    </ReactLenis>
  );
}
