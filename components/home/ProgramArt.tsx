// =============================================================================
// FILE: components/home/ProgramArt.tsx
// Small animated illustrations for the program cards (pure CSS/SVG).
// =============================================================================

import type { Program } from '@/lib/content/types';
import { Icon } from './icons';

export default function ProgramArt({ art, featured }: { art: Program['art']; featured?: boolean }) {
  const fg = featured ? 'text-ink' : 'text-emerald';

  if (art === 'terminal')
    return (
      <div className={`w-full rounded-2xl border p-4 font-mono text-[12px] leading-relaxed ${featured ? 'border-ink/20 bg-ink/90 text-paper' : 'border-white/10 bg-ink/60 text-paper'}`}>
        <div className="mb-3 flex gap-1.5">
          <i className="size-2.5 rounded-full bg-[#ff5f57]" />
          <i className="size-2.5 rounded-full bg-[#febc2e]" />
          <i className="size-2.5 rounded-full bg-[#28c840]" />
        </div>
        <p>
          <span className="text-emerald">$</span> whoami
        </p>
        <p className="text-paper/60">→ future defender</p>
        <p>
          <span className="text-emerald">$</span> start --course cs101
          <span className="ml-0.5 inline-block h-[1.05em] w-[0.55em] translate-y-[0.15em] animate-pulse bg-emerald" />
        </p>
      </div>
    );

  if (art === 'badge')
    return (
      <div className="relative grid h-full w-full place-items-center">
        {[0, 1, 2].map((i) => (
          <svg
            key={i}
            viewBox="0 0 100 40"
            className={`absolute w-28 ${fg} transition-transform duration-700 group-hover/prog:-translate-y-2`}
            style={{ top: `calc(50% - ${i * 22}px)`, opacity: 1 - i * 0.28, transitionDelay: `${i * 60}ms` }}
            aria-hidden
          >
            <path d="M5 30 50 8l45 22" fill="none" stroke="currentColor" strokeWidth="9" strokeLinejoin="round" strokeLinecap="round" />
          </svg>
        ))}
      </div>
    );

  if (art === 'mic')
    return (
      <div className="flex h-full w-full items-center justify-center gap-1.5" aria-hidden>
        {Array.from({ length: 18 }).map((_, i) => (
          <span
            key={i}
            className={`w-1.5 rounded-full ${featured ? 'bg-ink' : 'bg-emerald'} animate-[eq_1.2s_ease-in-out_infinite]`}
            style={{ height: `${20 + ((i * 37) % 60)}%`, animationDelay: `${(i % 6) * -0.17}s` }}
          />
        ))}
      </div>
    );

  if (art === 'lab')
    return (
      <div className="relative grid h-full w-full place-items-center" aria-hidden>
        <div className="absolute inset-0 rounded-2xl [mask-image:radial-gradient(circle,#000_35%,transparent_75%)]">
          <div
            className="size-full opacity-60"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='48.5'%3E%3Cpath d='M14 0l14 8.08v16.17L14 32.33 0 24.25V8.08zM14 32.33v16.17' fill='none' stroke='%2314b87a' stroke-opacity='.45'/%3E%3C/svg%3E\")",
            }}
          />
        </div>
        <span className="relative grid size-16 place-items-center rounded-2xl border border-emerald/50 bg-ink text-emerald shadow-[0_0_40px_-6px] shadow-emerald/70 transition-transform duration-500 group-hover/prog:rotate-6">
          <Icon.terminal className="size-8" />
        </span>
      </div>
    );

  // shield
  return (
    <div className="relative grid h-full w-full place-items-center" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="absolute rounded-full border border-emerald/40 animate-[ripple_3s_ease-out_infinite]"
          style={{ width: 70, height: 70, animationDelay: `${i}s` }}
        />
      ))}
      <span className="relative grid size-16 place-items-center rounded-full bg-emerald text-ink shadow-[0_0_50px_-4px] shadow-emerald/70">
        <Icon.shield className="size-8" />
      </span>
    </div>
  );
}
