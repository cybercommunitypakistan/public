// =============================================================================
// FILE: components/team/TeamSection.tsx
// "Meet the team" (/about). Content: database → TeamMember rows + Section 'about.team'
//   - Title rises word by word, cards reveal in batches on scroll
//   - Filter tabs with a sliding emerald indicator; cards rearrange with
//     GSAP Flip (smooth move / fade in / fade out)
//   - Ends with a "Your face here → Join the team" card
// =============================================================================

'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { gsap, Flip, ScrollTrigger, useGSAP, prefersReducedMotion } from '@/lib/gsap';
import type { SectionContent } from '@/lib/content/schemas';
import type { TeamGroupId, TeamMember } from '@/lib/content/types';
import { useSite } from '@/components/providers/SiteProvider';
import TeamCard from './TeamCard';

type FilterId = 'all' | TeamGroupId;
type Props = { intro: SectionContent<'about.team'>; team: TeamMember[] };
const GROUP_ORDER: TeamGroupId[] = ['core', 'leads', 'advisors'];

export default function TeamSection({ intro: teamIntro, team }: Props) {
  const site = useSite();
  // tabs: "All" + only the groups that have members
  const teamGroups: { id: FilterId; label: string }[] = [
    { id: 'all', label: teamIntro.groupLabels.all },
    ...GROUP_ORDER.filter((g) => team.some((m) => m.group === g)).map((g) => ({ id: g, label: teamIntro.groupLabels[g] })),
  ];
  const root = useRef<HTMLElement>(null);
  const tabs = useRef<HTMLDivElement>(null);
  const indicator = useRef<HTMLSpanElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const flipState = useRef<Flip.FlipState | null>(null);
  const prevHeight = useRef(0);
  const [filter, setFilter] = useState<FilterId>('all');

  const visible = team.filter((m) => filter === 'all' || m.group === filter).length;

  // ---- scroll reveals ----
  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      if (prefersReducedMotion()) return;

      gsap.fromTo(
        q('[data-team-word]'),
        { yPercent: 115 },
        { yPercent: 0, duration: 1.3, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: root.current, start: 'top 75%' } },
      );
      gsap.fromTo(
        q('[data-team-fade]'),
        { autoAlpha: 0, y: 24 },
        { autoAlpha: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: root.current, start: 'top 70%' } },
      );

      gsap.set(q('[data-team-item]'), { autoAlpha: 0, y: 90 });
      ScrollTrigger.batch(q('[data-team-item]'), {
        start: 'top 88%',
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, { autoAlpha: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.09, clearProps: 'transform' }),
      });
    },
    { scope: root },
  );

  // ---- sliding tab indicator ----
  useLayoutEffect(() => {
    const move = (instant = false) => {
      const btn = tabs.current?.querySelector<HTMLElement>(`[data-tab="${filter}"]`);
      if (!btn || !indicator.current) return;
      gsap.to(indicator.current, {
        x: btn.offsetLeft,
        width: btn.offsetWidth,
        duration: instant ? 0 : 0.6,
        ease: 'expo.out',
      });
    };
    move(true);
    const onResize = () => move(true);
    window.addEventListener('resize', onResize);
    document.fonts?.ready.then(() => move(true));
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // ---- Flip after the filter changes ----
  useLayoutEffect(() => {
    const btn = tabs.current?.querySelector<HTMLElement>(`[data-tab="${filter}"]`);
    if (btn && indicator.current) gsap.to(indicator.current, { x: btn.offsetLeft, width: btn.offsetWidth, duration: 0.6, ease: 'expo.out' });

    if (!flipState.current) return;
    const state = flipState.current;
    flipState.current = null;

    // grid height: animate old → new so the page below never jumps
    const g = grid.current;
    if (g) {
      const to = g.offsetHeight;
      gsap.fromTo(g, { height: prevHeight.current }, { height: to, duration: 0.8, ease: 'expo.inOut', clearProps: 'height' });
    }

    Flip.from(state, {
      duration: 0.8,
      ease: 'expo.inOut',
      absoluteOnLeave: true, // only leaving cards are lifted out; the rest move with transforms
      stagger: 0.03,
      onEnter: (els) => gsap.fromTo(els, { autoAlpha: 0, scale: 0.85 }, { autoAlpha: 1, scale: 1, duration: 0.7, delay: 0.25, ease: 'expo.out' }),
      onLeave: (els) => gsap.to(els, { autoAlpha: 0, scale: 0.85, duration: 0.4, ease: 'power2.in' }),
    });
  }, [filter]);

  const choose = (id: FilterId) => {
    if (id === filter) return;
    const items = root.current?.querySelectorAll('[data-team-item]');
    if (items && !prefersReducedMotion()) {
      gsap.set(items, { autoAlpha: 1, y: 0 }); // make sure the scroll reveal has finished
      prevHeight.current = grid.current?.offsetHeight ?? 0;
      flipState.current = Flip.getState(items);
    }
    setFilter(id);
  };

  return (
    <section ref={root} id="team" aria-labelledby="team-title" className="relative overflow-hidden bg-ink px-4 py-24 text-paper sm:px-6 sm:py-32 lg:px-10">
      {/* faint background grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35] [mask-image:linear-gradient(to_bottom,transparent,#000_20%,#000_70%,transparent)]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(243,245,244,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(243,245,244,.04) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
        }}
      />

      {/* ---------- Header ---------- */}
      <div className="relative grid gap-8 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7">
          <p data-team-fade className="font-mono text-[11px] uppercase tracking-[0.22em] text-emerald">
            // {teamIntro.eyebrow}
          </p>
          <h2 id="team-title" className="mt-6 font-display text-[clamp(52px,10vw,168px)] font-black uppercase leading-[0.86] tracking-[-0.055em]">
            {teamIntro.title.map((line, i) => (
              <span key={line} className="block overflow-hidden pb-[0.04em]">
                <span data-team-word className="inline-flex items-start">
                  {line}
                  {i === teamIntro.title.length - 1 && (
                    <span
                      aria-label={`${visible} members`}
                      className="ml-2 pt-[0.12em] font-mono text-[clamp(14px,1.6vw,22px)] font-normal leading-none tracking-normal text-emerald sm:ml-3"
                    >
                      ({String(visible).padStart(2, '0')})
                    </span>
                  )}
                </span>
              </span>
            ))}
          </h2>
        </div>

        <div className="lg:col-span-5 lg:justify-self-end lg:pb-3">
          <p data-team-fade className="max-w-md text-[16px] leading-relaxed text-paper/65 sm:text-[17px]">
            {teamIntro.body}
          </p>

          {/* Filter tabs */}
          <div data-team-fade className="no-scrollbar -mx-4 mt-7 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <div ref={tabs} role="tablist" aria-label="Filter team" className="relative inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1">
              <span ref={indicator} aria-hidden className="absolute bottom-1 left-0 top-1 rounded-full bg-emerald" />
              {teamGroups.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  role="tab"
                  data-tab={g.id}
                  aria-selected={filter === g.id}
                  onClick={() => choose(g.id)}
                  className={`relative z-10 whitespace-nowrap rounded-full px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] transition-colors duration-300 sm:px-5 ${
                    filter === g.id ? 'text-ink' : 'text-paper/70 hover:text-paper'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ---------- Grid ---------- */}
      <div ref={grid} role="tabpanel" className="relative mt-14 grid grid-cols-2 gap-3 sm:mt-20 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
        {team.map((m, i) => {
          const show = filter === 'all' || m.group === filter;
          return (
            <div key={m.id ?? `${m.name}-${m.role}-${i}`} data-team-item data-flip-id={`m-${m.id ?? i}`} className={show ? '' : 'hidden'}>
              <TeamCard member={m} index={i} />
            </div>
          );
        })}

        {/* Join card */}
        <div data-team-item data-flip-id="join">
          <a
            href={site.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group/join relative flex h-full min-h-[280px] flex-col justify-between overflow-hidden rounded-[22px] border-2 border-dashed border-white/15 p-5 transition-colors duration-500 hover:border-emerald hover:bg-emerald/[0.06] sm:p-6"
          >
            <span className="grid size-14 place-items-center rounded-full border border-white/15 text-emerald transition-all duration-500 group-hover/join:rotate-90 group-hover/join:border-emerald group-hover/join:bg-emerald group-hover/join:text-ink sm:size-16">
              <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                <path d="M12 5v14M5 12h14" />
              </svg>
            </span>
            <span>
              <span className="block font-display text-2xl font-extrabold leading-tight tracking-[-0.03em] sm:text-3xl">{teamIntro.join.title}</span>
              <span className="mt-2 block text-[13.5px] leading-snug text-paper/55 sm:text-sm">{teamIntro.join.body}</span>
              <span className="mt-5 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald transition-[gap] duration-300 group-hover/join:gap-3">
                {teamIntro.join.cta}
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </span>
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
