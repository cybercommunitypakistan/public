// =============================================================================
// FILE: components/footer/PillButton.tsx
// Outlined pill (footer CTAs). Hover: fills from the bottom, text inverts,
// icon nudges, and the whole pill is gently pulled toward the cursor
// (magnetic, mouse only).
// =============================================================================

'use client';

import { useRef } from 'react';
import { gsap } from '@/lib/gsap';

type Props = {
  href: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  external?: boolean;
};

export default function PillButton({ href, children, icon, external }: Props) {
  const el = useRef<HTMLAnchorElement>(null);

  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse' || !el.current) return;
    const r = el.current.getBoundingClientRect();
    gsap.to(el.current, {
      x: (e.clientX - (r.left + r.width / 2)) * 0.18,
      y: (e.clientY - (r.top + r.height / 2)) * 0.3,
      duration: 0.5,
      ease: 'power3.out',
    });
  };
  const onLeave = () => el.current && gsap.to(el.current, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.4)' });

  return (
    <a
      ref={el}
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className="group/pill relative inline-flex items-center gap-3 overflow-hidden rounded-full border border-paper/35 px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-paper transition-[color,border-color] duration-500 hover:border-emerald hover:text-ink sm:px-6 sm:py-4"
    >
      {/* fill */}
      <span
        aria-hidden
        className="absolute inset-0 translate-y-[101%] rounded-full bg-emerald transition-transform duration-500 ease-[cubic-bezier(.76,0,.24,1)] group-hover/pill:translate-y-0"
      />
      <span className="relative">{children}</span>
      {icon && <span className="relative transition-transform duration-500 group-hover/pill:translate-x-1">{icon}</span>}
    </a>
  );
}
