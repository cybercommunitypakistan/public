// =============================================================================
// FILE: components/providers/SiteProvider.tsx
// Makes the global site data (name, email, logo, menu, socials, footer…)
// available to every client component. Loaded once from the database in
// app/layout.tsx and passed in here.
//   const site = useSite();
// =============================================================================

'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { SiteData } from '@/lib/content/types';

const SiteContext = createContext<SiteData | null>(null);

export default function SiteProvider({ value, children }: { value: SiteData; children: ReactNode }) {
  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export function useSite(): SiteData {
  const v = useContext(SiteContext);
  if (!v) throw new Error('useSite() must be used inside <SiteProvider>');
  return v;
}
