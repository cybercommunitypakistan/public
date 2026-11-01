// =============================================================================
// FILE: components/footer/FooterWordmark.tsx
// Giant full-width wordmark at the bottom of the footer, using the same WebGL
// ink engine as the home hero — colours inverted (paper-white letters on navy,
// white ink; the emerald texture shows where ink crosses the letters).
// Letters rise in via `engine.reveal` (driven by SiteFooter's ScrollTrigger).
// It fills its parent box (the footer gives it all the space left over) and
// the word is fitted to the full width, sitting on the bottom edge.
// =============================================================================

'use client';

import { useState } from 'react';
import InkCanvas from '@/components/hero/ink/InkCanvas';
import type { InkEngine } from '@/components/hero/ink/InkEngine';
import { DISPLAY_FONT, DISPLAY_WEIGHT } from '@/lib/fonts';

const PAD_X = 0.012;
const MAX_H = 0.9;

type Props = {
  word: string;
  onReady?: (engine: InkEngine) => void;
  className?: string;
};

export default function FooterWordmark({ word, onReady, className = '' }: Props) {
  const [fallback, setFallback] = useState(false);

  return (
    <div className={`relative w-full ${className}`}>
      {!fallback ? (
        <InkCanvas
          lines={[word]}
          fontFamily={DISPLAY_FONT}
          fontWeight={DISPLAY_WEIGHT}
          colors={{ paper: '#04111d', ink: '#f3f5f4' }} // paper = footer bg (ink-deep)
          intro={0}
          layout={{ maxHeight: MAX_H, padX: PAD_X, anchor: 'bottom' }}
          letterReveal
          lifetime={1.5}
          brush={0.9}
          onReady={onReady}
          onFallback={() => setFallback(true)}
        />
      ) : (
        <p aria-hidden className="absolute inset-x-0 bottom-0 text-center font-display text-[min(30vw,40svh)] font-black leading-[0.8] tracking-[-0.04em] text-paper">
          {word}
        </p>
      )}
    </div>
  );
}
