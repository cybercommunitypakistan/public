// =============================================================================
// FILE: lib/cms/theme.ts
// Colour schemes. Each token overrides a Tailwind @theme variable from
// app/globals.css, so every bg-ink / text-paper / text-emerald… follows it.
// =============================================================================

export const THEME_TOKENS = {
  paper: { label: 'Text (paper)', css: '--color-paper' },
  ink: { label: 'Background (ink)', css: '--color-ink' },
  ink2: { label: 'Surface (ink 2)', css: '--color-ink-2' },
  inkDeep: { label: 'Footer (deep ink)', css: '--color-ink-deep' },
  emerald: { label: 'Accent', css: '--color-emerald' },
  emeraldSoft: { label: 'Accent soft', css: '--color-emerald-soft' },
  rose: { label: 'Highlight', css: '--color-rose' },
} as const;

export type ThemeToken = keyof typeof THEME_TOKENS;
export type ThemeColors = Record<ThemeToken, string>;

export const THEME_PRESETS: { id: string; name: string; colors: ThemeColors }[] = [
  { id: 'midnight-emerald', name: 'Midnight Emerald', colors: { paper: '#f3f5f4', ink: '#071a2b', ink2: '#0c2740', inkDeep: '#04111d', emerald: '#14b87a', emeraldSoft: '#5fe0aa', rose: '#ff7aa8' } },
  { id: 'ocean-signal', name: 'Ocean Signal', colors: { paper: '#eef6fb', ink: '#06182e', ink2: '#0b2a4a', inkDeep: '#030d1a', emerald: '#2ec5ff', emeraldSoft: '#8fe1ff', rose: '#ff7aa8' } },
  { id: 'crimson-ops', name: 'Crimson Ops', colors: { paper: '#f6f1f1', ink: '#170a0e', ink2: '#2a1219', inkDeep: '#0d0507', emerald: '#ff4d5e', emeraldSoft: '#ff9aa3', rose: '#ffb35c' } },
  { id: 'solar-amber', name: 'Solar Amber', colors: { paper: '#f7f4ec', ink: '#14110a', ink2: '#241d10', inkDeep: '#0a0804', emerald: '#f5b324', emeraldSoft: '#ffd57a', rose: '#ff7a59' } },
  { id: 'violet-grid', name: 'Violet Grid', colors: { paper: '#f3f1fb', ink: '#100c22', ink2: '#1c1638', inkDeep: '#080614', emerald: '#9b7bff', emeraldSoft: '#c9bbff', rose: '#ff7ad9' } },
  { id: 'matrix', name: 'Matrix Terminal', colors: { paper: '#e6f5e9', ink: '#050b07', ink2: '#0c1a10', inkDeep: '#020503', emerald: '#39ff88', emeraldSoft: '#a5ffc8', rose: '#ffe66d' } },
];

const HEX = /^#[0-9a-f]{6}$/i;
export const isHex = (v: unknown): v is string => typeof v === 'string' && HEX.test(v);

export function resolveTheme(theme?: { preset?: string; colors?: Record<string, unknown> } | null): ThemeColors {
  const base = THEME_PRESETS.find((p) => p.id === theme?.preset)?.colors ?? THEME_PRESETS[0].colors;
  if (theme?.preset !== 'custom') return base;
  const out = { ...base };
  for (const k of Object.keys(THEME_TOKENS) as ThemeToken[]) {
    const v = theme.colors?.[k];
    if (isHex(v)) out[k] = v;
  }
  return out;
}

/** CSS injected into <head>. Values are validated hex, so this can't inject CSS. */
export function themeCss(colors: ThemeColors): string {
  const vars = (Object.keys(THEME_TOKENS) as ThemeToken[])
    .filter((k) => isHex(colors[k]))
    .map((k) => `${THEME_TOKENS[k].css}:${colors[k]}`)
    .join(';');
  return `:root{${vars}}`;
}
