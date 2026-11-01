// =============================================================================
// FILE: components/layout/SiteLogo.tsx
// Logo: renders the logo image from site settings (database) when set,
// otherwise the built-in text mark.
// =============================================================================

'use client';

import Image from 'next/image';
import { useSite } from '@/components/providers/SiteProvider';

type Props = {
  /** Override the rendered height in px (defaults to logo.displayHeight). */
  height?: number;
  className?: string;
  priority?: boolean;
};

export default function SiteLogo({ height, className = '', priority = false }: Props) {
  const site = useSite();
  const logo = site.logo;

  if (logo) {
    const h = height ?? logo.displayHeight ?? 32;
    return (
      <Image
        src={logo.src}
        alt={logo.alt}
        width={logo.width}
        height={logo.height}
        priority={priority}
        unoptimized={logo.src.endsWith('.svg')}
        // mobile ≈ 80% of desktop height, width follows the aspect ratio
        style={{ ['--logo-h' as string]: `${h}px` }}
        className={`h-[calc(var(--logo-h)*0.8)] w-auto select-none sm:h-[var(--logo-h)] ${className}`}
        draggable={false}
      />
    );
  }

  // Fallback text mark (no image configured)
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <span className="grid size-8 place-items-center rounded-[9px] border border-current">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden>
          <path d="M12 2.5 4 5.5v6c0 5 3.4 8.7 8 10 4.6-1.3 8-5 8-10v-6l-8-3Z" />
          <path d="m8.5 12 2.5 2.5 4.5-5" />
        </svg>
      </span>
      <span className="leading-none">
        <span className="block text-[13px] font-bold tracking-tight">{site.short}</span>
        <span className="hidden font-mono text-[9.5px] uppercase tracking-[0.16em] sm:block">{site.name}</span>
      </span>
    </span>
  );
}
