// FILE: app/admin/(panel)/theme/ThemeEditor.tsx — presets, custom colours, live preview
'use client';

import { useState } from 'react';
import ActionForm, { SubmitButton } from '@/components/admin/ActionForm';
import { Card, cx } from '@/components/admin/ui';
import { THEME_TOKENS, type ThemeColors, type ThemeToken } from '@/lib/cms/theme';
import { saveTheme } from '../../_actions/settings';

export default function ThemeEditor({ presets, current }: { presets: { id: string; name: string; colors: ThemeColors }[]; current: { preset: string; colors: ThemeColors } }) {
  const [preset, setPreset] = useState(current.preset);
  const [colors, setColors] = useState<ThemeColors>(current.colors);
  const pick = (id: string) => { setPreset(id); const p = presets.find((x) => x.id === id); if (p) setColors(p.colors); };
  const c = colors;

  return (
    <ActionForm action={saveTheme} className="grid gap-6 xl:grid-cols-[1fr_420px]">
      <input type="hidden" name="preset" value={preset} />
      {(Object.keys(THEME_TOKENS) as ThemeToken[]).map((k) => <input key={k} type="hidden" name={`c_${k}`} value={colors[k]} />)}
      <div className="space-y-6">
        <Card title="Presets">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {presets.map((p) => (
              <button key={p.id} type="button" onClick={() => pick(p.id)}
                className={cx('overflow-hidden rounded-2xl border text-left transition', preset === p.id ? 'border-emerald ring-4 ring-emerald/15' : 'border-white/10 hover:border-white/25')}>
                <div className="flex h-16" style={{ background: p.colors.ink }}>
                  <div className="flex-1" />
                  {(['ink2', 'emerald', 'emeraldSoft', 'rose', 'paper'] as const).map((k) => <div key={k} className="w-5" style={{ background: p.colors[k] }} />)}
                </div>
                <div className="flex items-center justify-between px-3.5 py-2.5 text-[13px]">
                  {p.name}{preset === p.id && <span className="text-emerald">✓</span>}
                </div>
              </button>
            ))}
          </div>
        </Card>
        <Card title="Custom colours" description="Changing any colour switches to a custom scheme. Keep good contrast between text and background.">
          <div className="grid gap-3 sm:grid-cols-2">
            {(Object.keys(THEME_TOKENS) as ThemeToken[]).map((k) => (
              <label key={k} className="flex items-center gap-3 rounded-xl border border-white/[0.07] px-3 py-2.5">
                <input type="color" value={colors[k]} onChange={(e) => { setPreset('custom'); setColors({ ...colors, [k]: e.target.value }); }} className="size-9 cursor-pointer rounded-lg border-0 bg-transparent p-0" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px]">{THEME_TOKENS[k].label}</span>
                  <span className="font-mono text-[11px] uppercase text-paper/40">{colors[k]}</span>
                </span>
              </label>
            ))}
          </div>
        </Card>
        <SubmitButton>Apply to website</SubmitButton>
      </div>

      <div className="xl:sticky xl:top-8 xl:self-start">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-paper/40">Live preview</p>
        <div className="overflow-hidden rounded-3xl border border-white/10 shadow-2xl" style={{ background: c.ink, color: c.paper }}>
          <div className="flex items-center justify-between px-5 py-4 text-[11px] font-bold uppercase tracking-widest"><span>CCP</span><span className="rounded-full border px-3 py-1" style={{ borderColor: `${c.paper}40` }}>Menu</span></div>
          <div className="px-5 pb-6 pt-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: c.emerald }}>Cyber Community Pakistan</p>
            <p className="mt-2 font-display text-[40px] font-black uppercase leading-[0.85] tracking-tight">Build the<br />defenders</p>
            <p className="mt-3 text-[13px]" style={{ color: `${c.paper}b0` }}>Free, hands-on cyber security learning for everyone.</p>
            <div className="mt-4 flex gap-2">
              <span className="rounded-full px-4 py-2 text-[11px] font-black uppercase" style={{ background: c.emerald, color: c.ink }}>Apply now</span>
              <span className="rounded-full px-4 py-2 text-[11px] font-black uppercase" style={{ border: `1px solid ${c.paper}40` }}>Programs</span>
            </div>
          </div>
          <div className="m-3 rounded-2xl p-4" style={{ background: c.ink2 }}>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: c.emeraldSoft }}>12 Nov · Workshop</p>
            <p className="mt-1 font-display text-lg font-black uppercase">Web hacking 101</p>
            <span className="mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: c.rose, color: c.ink }}>SecureHer</span>
          </div>
          <div className="px-5 py-4 text-[11px]" style={{ background: c.inkDeep, color: `${c.paper}80` }}>Footer · © CCP</div>
        </div>
      </div>
    </ActionForm>
  );
}
