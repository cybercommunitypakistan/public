// =============================================================================
// FILE: components/hero/RotatingBadge.tsx
// Round "Apply now" badge with text spinning around an arrow.
// =============================================================================

type Props = {
  href: string;
  text: string;
  className?: string;
};

export default function RotatingBadge({ href, text, className = '' }: Props) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Apply for the Ambassador Program"
      className={`group relative grid size-24 place-items-center rounded-full bg-emerald text-ink shadow-[0_10px_40px_-10px] shadow-emerald/60 transition-transform duration-500 ease-out hover:scale-105 sm:size-28 ${className}`}
    >
      <svg viewBox="0 0 100 100" aria-hidden className="absolute inset-0 size-full animate-[spin_14s_linear_infinite] group-hover:animate-[spin_5s_linear_infinite]">
        <defs>
          <path id="ccp-ring" d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" />
        </defs>
        <text className="fill-current font-mono text-[8.6px] font-semibold uppercase tracking-[0.18em]">
          <textPath href="#ccp-ring">{text}</textPath>
        </text>
      </svg>
      <span className="grid size-9 place-items-center rounded-full bg-ink text-emerald transition-transform duration-500 group-hover:rotate-45 sm:size-10">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M7 17 17 7M8 7h9v9" />
        </svg>
      </span>
    </a>
  );
}
