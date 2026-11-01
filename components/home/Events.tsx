// =============================================================================
// FILE: components/home/Events.tsx
// Home section 7 — Upcoming sessions.
//   - Shows the next N events from today (Pakistan time); past ones drop off
//     automatically, so the list stays current without edits.
//   - Rows: big date block, title, series, format, register arrow.
//   - Hover (desktop): emerald fill wipes in from the left and a preview card
//     follows the cursor with the session description.
//   - Rows rise in on scroll.
// Content: database → Event rows + Section 'home.events' (props)
// =============================================================================

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { gsap, useGSAP, prefersReducedMotion } from '@/lib/gsap';
import type { SectionContent } from '@/lib/content/schemas';
import type { EventItem } from '@/lib/content/types';
import { Icon } from './icons';

function parts(iso: string) {
  const d = new Date(`${iso}T00:00:00Z`);
  const f = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', ...o }).format(d);
  return { day: f({ day: '2-digit' }), month: f({ month: 'short' }), weekday: f({ weekday: 'short' }) };
}

/** today's date in Pakistan as yyyy-mm-dd */
function todayPK() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi' }).format(new Date());
}

type Props = { intro: SectionContent<'home.events'>; events: EventItem[] };

export default function Events({ intro: eventsIntro, events }: Props) {
  const root = useRef<HTMLElement>(null);
  const preview = useRef<HTMLDivElement>(null);
  const [today, setToday] = useState<string | null>(null);
  const [active, setActive] = useState<EventItem | null>(null);

  useEffect(() => setToday(todayPK()), []);

  // before mount: first N (matches the server); after mount: next N from today
  const list = useMemo(() => {
    const upcoming = today ? events.filter((e) => e.date >= today) : events;
    return upcoming.slice(0, eventsIntro.limit);
  }, [today, events, eventsIntro.limit]);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const q = gsap.utils.selector(root);
      gsap.fromTo(q('[data-e-word]'), { yPercent: 110 }, { yPercent: 0, duration: 1.2, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: root.current, start: 'top 75%' } });
      gsap.fromTo(q('[data-e-fade]'), { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: root.current, start: 'top 75%' } });
      gsap.fromTo(q('[data-e-row]'), { autoAlpha: 0, y: 50 }, { autoAlpha: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: q('[data-e-list]')[0], start: 'top 82%' } });
    },
    { scope: root, dependencies: [list.length], revertOnUpdate: true },
  );

  // cursor-following preview (mouse only)
  useEffect(() => {
    const el = preview.current;
    if (!el) return;
    const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' });
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      xTo(e.clientX + 24);
      yTo(e.clientY + 24);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  useEffect(() => {
    if (preview.current) gsap.to(preview.current, { autoAlpha: active ? 1 : 0, scale: active ? 1 : 0.85, duration: 0.35, ease: 'power3.out' });
  }, [active]);

  return (
    <section ref={root} id="events" aria-labelledby="events-title" className="relative bg-ink px-4 py-24 text-paper sm:px-6 sm:py-32 lg:px-10">
      {/* Header */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p data-e-fade className="font-mono text-[11px] uppercase tracking-[0.22em] text-emerald">
            // {eventsIntro.eyebrow}
          </p>
          <h2 id="events-title" className="mt-4 font-display text-[clamp(44px,7vw,112px)] font-black uppercase leading-[0.88] tracking-[-0.05em]">
            {eventsIntro.title.split(' ').map((w, i) => (
              <span key={i} className="block overflow-hidden pb-[0.04em]">
                <span data-e-word className="block">
                  {w}
                </span>
              </span>
            ))}
          </h2>
        </div>
        <div data-e-fade className="max-w-sm lg:pb-2">
          <p className="text-[15.5px] leading-relaxed text-paper/65">{eventsIntro.body}</p>
          <a
            href={eventsIntro.ctaHref}
            {...(/^https?:/.test(eventsIntro.ctaHref) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald px-5 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-ink transition-[gap] duration-300 hover:gap-3"
          >
            {eventsIntro.ctaLabel}
            <Icon.arrow className="size-4" />
          </a>
        </div>
      </div>

      {/* List */}
      <ul data-e-list className="mt-14 border-t border-white/10 sm:mt-20" onPointerLeave={() => setActive(null)}>
        {list.length === 0 && <li className="py-10 text-paper/60">New sessions are coming soon — follow us to hear first.</li>}
        {list.map((ev, i) => {
          const d = parts(ev.date);
          const isNext = i === 0 && today !== null;
          return (
            <li key={ev.date + ev.title} data-e-row className="border-b border-white/10">
              <a
                href={ev.href}
                target="_blank"
                rel="noopener noreferrer"
                onPointerEnter={(e) => e.pointerType === 'mouse' && setActive(ev)}
                className="group/ev relative grid grid-cols-[64px_1fr_auto] items-center gap-4 overflow-hidden py-5 outline-none sm:grid-cols-[96px_1fr_auto] sm:gap-6 sm:py-7 lg:grid-cols-[120px_1fr_220px_auto]"
              >
                {/* hover fill */}
                <span aria-hidden className="absolute inset-0 origin-left scale-x-0 bg-emerald transition-transform duration-500 ease-[cubic-bezier(.76,0,.24,1)] group-hover/ev:scale-x-100 group-focus-visible/ev:scale-x-100" />

                {/* date */}
                <span className="relative flex flex-col leading-none transition-[color,transform] duration-500 group-hover/ev:translate-x-3 group-hover/ev:text-ink">
                  <span className="font-display text-[34px] font-black tracking-[-0.04em] sm:text-[52px]">{d.day}</span>
                  <span className="mt-1 font-mono text-[10.5px] uppercase tracking-[0.16em] text-paper/55 transition-colors group-hover/ev:text-ink/70 sm:text-[11px]">
                    {d.month} · {d.weekday}
                  </span>
                </span>

                {/* title */}
                <span className="relative min-w-0 transition-[color,transform] duration-500 group-hover/ev:translate-x-3 group-hover/ev:text-ink">
                  <span className="flex flex-wrap items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-emerald transition-colors group-hover/ev:text-ink/70 sm:text-[11px]">
                    {ev.series ?? ev.type}
                    {isNext && <span className="rounded-full bg-emerald/15 px-2 py-0.5 text-emerald transition-colors group-hover/ev:bg-ink group-hover/ev:text-emerald">Next up</span>}
                  </span>
                  <span className="mt-1.5 block font-display text-[19px] font-extrabold leading-tight tracking-[-0.03em] sm:text-[26px] lg:text-[30px]">{ev.title}</span>
                  <span className="mt-1.5 block text-[13px] leading-snug text-paper/55 transition-colors group-hover/ev:text-ink/70 lg:hidden">{ev.format}</span>
                </span>

                {/* format (desktop) */}
                <span className="relative hidden text-[14px] text-paper/60 transition-colors group-hover/ev:text-ink/75 lg:block">{ev.format}</span>

                {/* arrow */}
                <span className="relative grid size-11 place-items-center rounded-full border border-white/15 transition-all duration-500 group-hover/ev:-rotate-45 group-hover/ev:border-ink group-hover/ev:bg-ink group-hover/ev:text-emerald sm:size-14">
                  <Icon.arrow className="size-5" />
                </span>
              </a>
            </li>
          );
        })}
      </ul>

      {/* cursor preview (desktop) */}
      <div
        ref={preview}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-40 hidden w-72 rounded-2xl border border-white/10 bg-ink-2/95 p-5 opacity-0 shadow-[0_30px_60px_-20px_rgba(0,0,0,.6)] backdrop-blur-md lg:block"
      >
        {active && (
          <>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald/15 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-emerald">
              <span className="size-1.5 rounded-full bg-emerald" />
              {active.type}
            </span>
            <p className="mt-3 text-[14px] leading-relaxed text-paper/80">{active.description}</p>
            <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-paper/50">Click to register →</p>
          </>
        )}
      </div>
    </section>
  );
}
