// =============================================================================
// FILE: components/about/DotField.tsx
// Interactive dot grid (2D canvas) for the About hero.
//  - Dots near the cursor grow, glow emerald and get pushed away slightly
//  - Click / tap sends a ripple ring across the grid
//  - A slow diagonal wave keeps it alive when nobody is interacting
//  - Pauses off-screen; static grid for reduced-motion users
// Fills its positioned parent. Pointer events come from window, so overlay
// content on top of it never blocks the effect.
// =============================================================================

'use client';

import { useEffect, useRef } from 'react';

type Props = {
  className?: string;
  /** Dot colour (rgb triplet) */
  base?: [number, number, number];
  /** Highlight colour (rgb triplet) */
  accent?: [number, number, number];
};

type Ripple = { x: number; y: number; t0: number };

// module-level defaults so the effect doesn't re-run on every render
const PAPER: [number, number, number] = [243, 245, 244];
const EMERALD: [number, number, number] = [20, 184, 122];

export default function DotField({ className = '', base = PAPER, accent = EMERALD }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let W = 0;
    let H = 0;
    let gap = 26;
    let cols = 0;
    let rows = 0;
    let ox = 0;
    let oy = 0;

    // pointer (raw + smoothed)
    const p = { x: -9999, y: -9999, sx: -9999, sy: -9999, inside: false, power: 0 };
    const ripples: Ripple[] = [];

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      W = r.width;
      H = r.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      gap = W < 640 ? 22 : 26;
      cols = Math.ceil(W / gap) + 1;
      rows = Math.ceil(H / gap) + 1;
      ox = (W - (cols - 1) * gap) / 2;
      oy = (H - (rows - 1) * gap) / 2;
      if (reduce) draw(0);
    };

    const toLocal = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top, inside: e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom };
    };
    const onMove = (e: PointerEvent) => {
      const l = toLocal(e);
      p.x = l.x;
      p.y = l.y;
      if (l.inside && !p.inside) {
        p.sx = l.x;
        p.sy = l.y;
      }
      p.inside = l.inside;
    };
    const onDown = (e: PointerEvent) => {
      const l = toLocal(e);
      if (l.inside && ripples.length < 6) ripples.push({ x: l.x, y: l.y, t0: performance.now() });
    };
    const onLeave = () => (p.inside = false);

    const R = () => Math.max(120, Math.min(W, H) * 0.22); // cursor influence radius

    function draw(now: number) {
      ctx!.clearRect(0, 0, W, H);
      const t = now / 1000;
      const rad = R();
      const [br, bg, bb] = base;
      const [ar, ag, ab] = accent;

      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          let x = ox + i * gap;
          let y = oy + j * gap;

          // idle diagonal wave
          const wave = reduce ? 0 : Math.max(0, Math.sin(x * 0.008 + y * 0.005 - t * 1.1)) ** 6 * 0.55;

          // cursor
          let hit = 0;
          if (p.power > 0.01) {
            const dx = x - p.sx;
            const dy = y - p.sy;
            const d = Math.hypot(dx, dy);
            if (d < rad) {
              hit = (1 - d / rad) ** 2 * p.power;
              const push = hit * 10;
              x += (dx / (d || 1)) * push;
              y += (dy / (d || 1)) * push;
            }
          }

          // ripples
          let rip = 0;
          for (const r of ripples) {
            const age = (now - r.t0) / 1000;
            const front = age * 520;
            const d = Math.hypot(x - r.x, y - r.y);
            const band = Math.exp(-(((d - front) / 34) ** 2));
            rip = Math.max(rip, band * Math.max(0, 1 - age / 1.4));
          }

          const k = Math.min(1, hit + rip + wave * 0.6);
          const size = 1.05 + k * 2.4;
          const a = 0.13 + k * 0.87;
          const c = Math.min(1, hit * 1.4 + rip + wave);
          ctx!.fillStyle = `rgba(${br + (ar - br) * c | 0},${bg + (ag - bg) * c | 0},${bb + (ab - bb) * c | 0},${a})`;
          ctx!.beginPath();
          ctx!.arc(x, y, size, 0, Math.PI * 2);
          ctx!.fill();
        }
      }
    }

    let raf = 0;
    let visible = true;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (!visible) return;
      // smooth pointer + fade influence in/out
      p.sx += (p.x - p.sx) * 0.16;
      p.sy += (p.y - p.sy) * 0.16;
      p.power += ((p.inside ? 1 : 0) - p.power) * 0.08;
      for (let i = ripples.length - 1; i >= 0; i--) if (now - ripples[i].t0 > 1500) ripples.splice(i, 1);
      draw(now);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(canvas);
    resize();

    if (!reduce) {
      window.addEventListener('pointermove', onMove, { passive: true });
      window.addEventListener('pointerdown', onDown, { passive: true });
      document.documentElement.addEventListener('pointerleave', onLeave);
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, [base, accent]);

  return <canvas ref={ref} aria-hidden className={`absolute inset-0 block h-full w-full ${className}`} />;
}
