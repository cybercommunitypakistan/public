// =============================================================================
// FILE: components/team/TeamCard.tsx
// One team member styled as a CCP "access card".
// Hover (mouse): 3D tilt toward the cursor, emerald sheen that follows it,
// scan line sweeps the portrait, corner brackets lock on, photo goes from
// grayscale to colour, social links slide up.
// Touch devices: no tilt; photo in colour and links always visible.
// =============================================================================

'use client';

import Image from 'next/image';
import { useRef } from 'react';
import type { TeamMember } from '@/lib/content/types';
import TeamAvatar from './TeamAvatar';

type Props = { member: TeamMember; index: number };

const ICONS = {
  linkedin: (
    <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.5h4V21H3V9.5Zm7 0h3.8v1.6h.06c.53-1 1.83-2.06 3.77-2.06 4.03 0 4.77 2.65 4.77 6.1V21h-4v-5.1c0-1.22-.02-2.78-1.7-2.78-1.7 0-1.96 1.33-1.96 2.7V21h-4V9.5Z" fill="currentColor" />
  ),
  x: <path d="M17.5 3h3.2l-7 8 8.2 10h-6.4l-5-6.2L4.8 21H1.6l7.5-8.6L1.2 3h6.6l4.5 5.7L17.5 3Zm-1.1 16.2h1.8L6.6 4.7H4.7l11.7 14.5Z" fill="currentColor" />,
  github: (
    <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.6 9.6 0 0 1 5 0c1.91-1.3 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.75c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" fill="currentColor" />
  ),
  email: <path d="M3 5h18v14H3V5Zm2 2v.4l7 4.6 7-4.6V7H5Zm14 10V9.8l-7 4.6-7-4.6V17h14Z" fill="currentColor" />,
} as const;

const LABELS = { linkedin: 'LinkedIn', x: 'X', github: 'GitHub', email: 'Email' } as const;

export default function TeamCard({ member, index }: Props) {
  const card = useRef<HTMLDivElement>(null);
  const id = `CCP-${String(index + 1).padStart(3, '0')}`;

  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse' || !card.current) return;
    const r = card.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    const s = card.current.style;
    s.setProperty('--rx', `${(0.5 - py) * 9}deg`);
    s.setProperty('--ry', `${(px - 0.5) * 11}deg`);
    s.setProperty('--mx', `${px * 100}%`);
    s.setProperty('--my', `${py * 100}%`);
  };
  const onLeave = () => {
    const s = card.current?.style;
    s?.setProperty('--rx', '0deg');
    s?.setProperty('--ry', '0deg');
  };

  const links = Object.entries(member.links ?? {}).filter(([, v]) => v) as [keyof typeof ICONS, string][];

  return (
    <article data-team-card data-group={member.group} className="group/card [perspective:1100px]" onPointerMove={onMove} onPointerLeave={onLeave}>
      <div
        ref={card}
        className="relative overflow-hidden rounded-[22px] border border-white/10 bg-ink-2/50 transition-[transform,border-color,box-shadow] duration-500 ease-[cubic-bezier(.16,1,.3,1)] [transform:rotateX(var(--rx,0deg))_rotateY(var(--ry,0deg))] [transform-style:preserve-3d] hover:border-emerald/60 hover:shadow-[0_30px_80px_-30px_rgba(20,184,122,.45)]"
      >
        {/* ---------- Portrait ---------- */}
        <div className="relative aspect-[4/5] overflow-hidden">
          {member.photo ? (
            <Image
              src={member.photo}
              alt={member.name}
              fill
              sizes="(min-width:1280px) 25vw, (min-width:768px) 33vw, 50vw"
              className="object-cover grayscale contrast-[1.08] transition-[filter,transform] duration-700 group-hover/card:scale-[1.04] group-hover/card:grayscale-0 [@media(hover:none)]:grayscale-0"
            />
          ) : (
            <TeamAvatar name={member.name} role={member.role} index={index} />
          )}

          {/* bottom fade */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-ink via-ink/60 to-transparent" />

          {/* scan line */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1/3 -translate-y-full bg-gradient-to-b from-transparent via-emerald/25 to-transparent opacity-0 group-hover/card:animate-[team-scan_1.5s_cubic-bezier(.45,0,.2,1)_1] group-hover/card:opacity-100">
            <div className="absolute inset-x-0 bottom-1/2 h-px bg-emerald shadow-[0_0_12px_2px] shadow-emerald/70" />
          </div>

          {/* corner brackets */}
          {['left-3 top-3 border-l-2 border-t-2', 'right-3 top-3 border-r-2 border-t-2', 'bottom-3 left-3 border-b-2 border-l-2', 'bottom-3 right-3 border-b-2 border-r-2'].map((c) => (
            <span
              key={c}
              aria-hidden
              className={`pointer-events-none absolute size-5 border-emerald opacity-0 transition-all duration-500 group-hover/card:opacity-100 ${c} scale-150 group-hover/card:scale-100`}
            />
          ))}

          {/* ID + status chips */}
          <div className="absolute inset-x-3 top-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.16em] sm:inset-x-4 sm:top-4">
            <span className="rounded-full bg-ink/70 px-2.5 py-1 text-paper/80 backdrop-blur-sm transition-opacity duration-300 group-hover/card:opacity-0">{id}</span>
            <span className="flex items-center gap-1.5 rounded-full bg-ink/70 px-2.5 py-1 text-emerald backdrop-blur-sm transition-opacity duration-300 group-hover/card:opacity-0">
              <span className="size-1.5 rounded-full bg-emerald" />
              <span className="hidden sm:inline">{member.group}</span>
            </span>
          </div>

          {/* socials */}
          {links.length > 0 && (
            <div className="absolute inset-x-3 bottom-3 flex gap-2 transition-all duration-500 ease-[cubic-bezier(.16,1,.3,1)] sm:inset-x-4 sm:bottom-4 [@media(hover:hover)]:translate-y-3 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/card:translate-y-0 [@media(hover:hover)]:group-hover/card:opacity-100">
              {links.map(([k, href]) => (
                <a
                  key={k}
                  href={k === 'email' && !href.startsWith('mailto:') ? `mailto:${href}` : href}
                  {...(k === 'email' ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
                  aria-label={`${member.name} on ${LABELS[k]}`}
                  className="grid size-9 place-items-center rounded-full border border-white/15 bg-ink/70 text-paper backdrop-blur-md transition-colors hover:border-emerald hover:bg-emerald hover:text-ink"
                >
                  <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
                    {ICONS[k]}
                  </svg>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* ---------- Info ---------- */}
        <div className="relative p-4 sm:p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-emerald sm:text-[11px]">{member.role}</p>
          <h3 className="mt-1.5 font-display text-[19px] font-extrabold leading-tight tracking-[-0.03em] sm:text-2xl">{member.name}</h3>
          {member.city && (
            <p className="mt-2 flex items-center gap-1.5 text-[12.5px] text-paper/50">
              <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" />
                <circle cx="12" cy="9.5" r="2.5" />
              </svg>
              {member.city}, Pakistan
            </p>
          )}
        </div>

        {/* holographic sheen following the cursor */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 mix-blend-screen transition-opacity duration-500 group-hover/card:opacity-100"
          style={{ background: 'radial-gradient(420px circle at var(--mx,50%) var(--my,50%), rgba(20,184,122,.22), transparent 45%)' }}
        />
      </div>
    </article>
  );
}
