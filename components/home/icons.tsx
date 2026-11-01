// =============================================================================
// FILE: components/home/icons.tsx
// Small stroke icons shared by the home sections.
// =============================================================================

type P = { className?: string };
const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

export const Icon = {
  shield: ({ className }: P) => (
    <svg {...base} className={className}>
      <path d="M12 2.5 4 5.5v6c0 5 3.4 8.7 8 10 4.6-1.3 8-5 8-10v-6l-8-3Z" />
      <path d="m8.5 12 2.5 2.5 4.5-5" />
    </svg>
  ),
  terminal: ({ className }: P) => (
    <svg {...base} className={className}>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <path d="m7 9 3 3-3 3M12.5 15H17" />
    </svg>
  ),
  people: ({ className }: P) => (
    <svg {...base} className={className}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <path d="M16 4.6a3.2 3.2 0 0 1 0 6.3M18 14.3c1.8.8 3 2.6 3 4.7v1" />
    </svg>
  ),
  lock: ({ className }: P) => (
    <svg {...base} className={className}>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </svg>
  ),
  spark: ({ className }: P) => (
    <svg {...base} className={className}>
      <path d="M12 3c.5 4.6 3.4 7.5 8 8-4.6.5-7.5 3.4-8 8-.5-4.6-3.4-7.5-8-8 4.6-.5 7.5-3.4 8-8Z" />
    </svg>
  ),
  arrow: ({ className }: P) => (
    <svg {...base} className={className}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  arrowUpRight: ({ className }: P) => (
    <svg {...base} className={className}>
      <path d="M7 17 17 7M8 7h9v9" />
    </svg>
  ),
  plus: ({ className }: P) => (
    <svg {...base} className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  mail: ({ className }: P) => (
    <svg {...base} className={className}>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  ),
  quote: ({ className }: P) => (
    <svg viewBox="0 0 48 48" fill="currentColor" aria-hidden className={className}>
      <path d="M8 36V24c0-8 4-13.5 12-16l2 4c-4.4 1.8-6.6 4.8-7 8h7v16H8Zm18 0V24c0-8 4-13.5 12-16l2 4c-4.4 1.8-6.6 4.8-7 8h7v16H26Z" />
    </svg>
  ),
};

export type IconName = keyof typeof Icon;
