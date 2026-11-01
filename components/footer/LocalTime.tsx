// =============================================================================
// FILE: components/footer/LocalTime.tsx
// Live local clock (e.g. "01:27 PKT") with a blinking colon.
// Renders "--:--" on the server, then the real time after mount.
// =============================================================================

'use client';

import { useEffect, useState } from 'react';

export default function LocalTime({ timeZone = 'Asia/Karachi', label = 'PKT' }: { timeZone?: string; label?: string }) {
  const [parts, setParts] = useState<[string, string] | null>(null);

  useEffect(() => {
    const fmt = new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit', hour12: false });
    const tick = () => {
      const [h, m] = fmt.format(new Date()).split(':');
      setParts([h, m]);
    };
    tick();
    const id = window.setInterval(tick, 15_000);
    return () => window.clearInterval(id);
  }, [timeZone]);

  return (
    <span className="tabular-nums">
      {parts ? parts[0] : '--'}
      <span className="animate-pulse">:</span>
      {parts ? parts[1] : '--'} {label}
    </span>
  );
}
