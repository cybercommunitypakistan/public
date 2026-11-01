// =============================================================================
// FILE: components/home/FAQ.tsx
// Home section 9 — FAQ.
//   Left (sticky on desktop): title, short note and a contact card.
//   Right: accordion — one open at a time, smooth height (grid-rows), the +
//   turns into ×, active row tints emerald. First item open by default.
// Content: database → Faq rows + Section 'home.faq' (props)
// =============================================================================

'use client';

import { useRef, useState } from 'react';
import { gsap, useGSAP, prefersReducedMotion } from '@/lib/gsap';
import type { SectionContent } from '@/lib/content/schemas';
import type { FaqItem } from '@/lib/content/types';
import { useSite } from '@/components/providers/SiteProvider';
import { Icon } from './icons';

type Props = { intro: SectionContent<'home.faq'>; faqs: FaqItem[] };

export default function FAQ({ intro: faqIntro, faqs }: Props) {
  const site = useSite();
  const root = useRef<HTMLElement>(null);
  const [open, setOpen] = useState<number | null>(0);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const q = gsap.utils.selector(root);
      gsap.fromTo(q('[data-f-word]'), { yPercent: 110 }, { yPercent: 0, duration: 1.2, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: root.current, start: 'top 75%' } });
      gsap.fromTo(q('[data-f-fade]'), { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: root.current, start: 'top 75%' } });
      gsap.fromTo(q('[data-f-item]'), { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.06, scrollTrigger: { trigger: q('[data-f-list]')[0], start: 'top 85%' } });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="faq" aria-labelledby="faq-title" className="relative bg-ink px-4 pb-28 pt-24 text-paper sm:px-6 sm:pb-36 sm:pt-32 lg:px-10">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
        {/* Left */}
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-28">
            <p data-f-fade className="font-mono text-[11px] uppercase tracking-[0.22em] text-emerald">
              // {faqIntro.eyebrow}
            </p>
            <h2 id="faq-title" className="mt-4 font-display text-[clamp(40px,4.6vw,84px)] font-black uppercase leading-[0.88] tracking-[-0.05em]">
              {faqIntro.title.map((l) => (
                <span key={l} className="block overflow-hidden pb-[0.04em]">
                  <span data-f-word className="block">
                    {l}
                  </span>
                </span>
              ))}
            </h2>
            <p data-f-fade className="mt-6 max-w-sm text-[15.5px] leading-relaxed text-paper/65">
              {faqIntro.body}
            </p>
            <a
              data-f-fade
              href={`mailto:${site.email}`}
              className="group/mail mt-7 flex max-w-sm items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-emerald"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-emerald text-ink">
                <Icon.mail className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="block font-mono text-[10.5px] uppercase tracking-[0.16em] text-paper/50">Email us</span>
                <span className="block truncate text-[15px] font-medium">{site.email}</span>
              </span>
              <Icon.arrowUpRight className="ml-auto size-5 shrink-0 text-emerald transition-transform duration-300 group-hover/mail:-translate-y-0.5 group-hover/mail:translate-x-0.5" />
            </a>
          </div>
        </div>

        {/* Right: accordion */}
        <ul data-f-list className="border-t border-white/10 lg:col-span-7">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            const id = `faq-${i}`;
            return (
              <li key={f.q} data-f-item className="border-b border-white/10">
                <h3>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={id}
                    onClick={() => setOpen(isOpen ? null : i)}
                    className={`group/faq flex w-full items-center gap-4 py-6 text-left outline-none transition-colors sm:gap-6 sm:py-7 ${isOpen ? 'text-emerald' : 'hover:text-emerald focus-visible:text-emerald'}`}
                  >
                    <span className="w-7 shrink-0 font-mono text-[12px] text-emerald/80">{String(i + 1).padStart(2, '0')}</span>
                    <span className="flex-1 text-[19px] font-semibold leading-snug tracking-[-0.02em] sm:text-[24px]">{f.q}</span>
                    <span
                      aria-hidden
                      className={`grid size-10 shrink-0 place-items-center rounded-full border transition-all duration-500 ${
                        isOpen ? 'rotate-45 border-emerald bg-emerald text-ink' : 'border-white/15 group-hover/faq:border-emerald'
                      }`}
                    >
                      <Icon.plus className="size-4" />
                    </span>
                  </button>
                </h3>
                <div id={id} role="region" className={`grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(.16,1,.3,1)] ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                  <div className="overflow-hidden">
                    <p
                      className={`pb-7 pl-11 pr-12 text-[15.5px] leading-relaxed text-paper/70 transition-[opacity,transform] duration-500 sm:pl-[52px] sm:text-[16.5px] ${
                        isOpen ? 'translate-y-0 opacity-100 delay-100' : '-translate-y-2 opacity-0'
                      }`}
                    >
                      {f.a}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
