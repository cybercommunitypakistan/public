// =============================================================================
// FILE: components/hero/ink/InkCanvas.tsx
// React wrapper around InkEngine. Fills its (positioned) parent.
// `onReady(engine)` fires once the wordmark font is loaded — use it to start
// GSAP animations that tween `engine.intro` / `engine.scroll`.
// `onFallback()` fires if WebGL2 is unavailable or the context is lost.
// =============================================================================

'use client';

import { useEffect, useRef } from 'react';
import { InkEngine, type InkEngineOptions } from './InkEngine';

type Props = Omit<InkEngineOptions, 'onContextLost'> & {
  onReady?: (engine: InkEngine) => void;
  onFallback?: () => void;
  className?: string;
};

export default function InkCanvas({ onReady, onFallback, className = '', ...options }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // keep latest callbacks without re-creating the engine
  const cb = useRef({ onReady, onFallback });
  cb.current = { onReady, onFallback };

  // re-create the engine only when visual options really change
  const key = JSON.stringify(options);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let engine: InkEngine | null = null;
    let cancelled = false;

    try {
      engine = new InkEngine(canvas, {
        ...(JSON.parse(key) as InkEngineOptions),
        onContextLost: () => cb.current.onFallback?.(),
      });
    } catch (err) {
      console.warn('[InkCanvas] falling back:', err);
      cb.current.onFallback?.();
      return;
    }

    engine.ready.then(() => {
      if (!cancelled && engine) cb.current.onReady?.(engine);
    });

    return () => {
      cancelled = true;
      engine?.destroy();
    };
  }, [key]);

  return <canvas ref={canvasRef} aria-hidden className={`absolute inset-0 block h-full w-full ${className}`} />;
}
