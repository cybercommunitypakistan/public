// =============================================================================
// FILE: components/admin/ObjectEditor.tsx
// Generic editor driven by a template object (the defaults). Used for every
// home/about section, page blocks and navigation. Rules by value type:
//   string → input (textarea for long/markdown-ish keys, image picker for image/src/cover keys)
//   number → number · boolean → toggle · string[] → one item per line
//   object[] → repeatable cards (add / remove / move) · object → nested group
// The server validates everything again with zod.
// =============================================================================
'use client';

import { useState } from 'react';
import ImageField from './ImageField';
import { inputCls, cx } from './ui';

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };
type Obj = { [k: string]: Json };

const LONG = /(body|text|markdown|description|answer|mission|statement|caption|blurb|quote|^a$|signature|tagline)$/i;
const IMAGE = /(image|src|cover|photo|avatar|logo)(url)?$/i;
const human = (k: string) => k.replace(/([A-Z])/g, ' $1').replace(/[_-]/g, ' ').replace(/^./, (c) => c.toUpperCase());

function blankLike(t: Json): Json {
  if (typeof t === 'string') return '';
  if (typeof t === 'number') return 0;
  if (typeof t === 'boolean') return false;
  if (Array.isArray(t)) return [];
  if (t && typeof t === 'object') return Object.fromEntries(Object.entries(t).map(([k, v]) => [k, blankLike(v)]));
  return null;
}

export function ValueEditor({ name, value, template, onChange, depth = 0 }: { name: string; value: Json; template: Json; onChange: (v: Json) => void; depth?: number }) {
  const t = template ?? value;
  if (typeof t === 'boolean') {
    return (
      <button type="button" role="switch" aria-checked={Boolean(value)} onClick={() => onChange(!value)}
        className={cx('relative h-6 w-11 rounded-full transition', value ? 'bg-emerald' : 'bg-white/15')}>
        <span className={cx('absolute top-0.5 size-5 rounded-full bg-paper transition', value ? 'left-[22px]' : 'left-0.5')} />
      </button>
    );
  }
  if (typeof t === 'number') return <input type="number" value={Number(value ?? 0)} onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))} className={inputCls} />;
  if (typeof t === 'string') {
    if (IMAGE.test(name)) return <ImageField value={String(value ?? '')} onChange={(u) => onChange(u)} />;
    const long = LONG.test(name) || String(value ?? '').length > 90 || name.toLowerCase().includes('markdown');
    return long
      ? <textarea value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} rows={name.toLowerCase().includes('markdown') ? 14 : 3} className={cx(inputCls, name.toLowerCase().includes('markdown') && 'font-mono text-[13px]')} />
      : <input value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} className={inputCls} />;
  }
  if (Array.isArray(t)) {
    const arr = Array.isArray(value) ? value : [];
    const itemT = t[0] ?? (arr[0] ?? '');
    if (typeof itemT === 'string') {
      return (
        <div>
          <textarea value={arr.join('\n')} onChange={(e) => onChange(e.target.value.split('\n'))} onBlur={(e) => onChange(e.target.value.split('\n').map((s) => s.trim()).filter(Boolean))} rows={Math.max(3, arr.length + 1)} className={inputCls} />
          <p className="mt-1 text-[11.5px] text-paper/40">One per line</p>
        </div>
      );
    }
    const move = (i: number, d: number) => { const n = [...arr]; const [x] = n.splice(i, 1); n.splice(i + d, 0, x); onChange(n); };
    return (
      <div className="space-y-3">
        {arr.map((item, i) => (
          <div key={i} className="rounded-xl border border-white/[0.08] bg-black/15 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-paper/40">#{i + 1}</span>
              <div className="flex gap-1">
                <IconBtn label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>↑</IconBtn>
                <IconBtn label="Move down" disabled={i === arr.length - 1} onClick={() => move(i, 1)}>↓</IconBtn>
                <IconBtn label="Remove" danger onClick={() => onChange(arr.filter((_, j) => j !== i))}>✕</IconBtn>
              </div>
            </div>
            <ValueEditor name={name} value={item} template={itemT} depth={depth + 1} onChange={(v) => onChange(arr.map((x, j) => (j === i ? v : x)))} />
          </div>
        ))}
        <button type="button" onClick={() => onChange([...arr, blankLike(itemT)])} className="w-full rounded-xl border border-dashed border-white/15 py-2.5 text-[13px] text-paper/60 hover:border-emerald hover:text-emerald">+ Add item</button>
      </div>
    );
  }
  if (t && typeof t === 'object') {
    const v = (value && typeof value === 'object' && !Array.isArray(value) ? value : {}) as Obj;
    return (
      <div className={cx('grid gap-4', depth === 0 ? 'sm:grid-cols-2' : '')}>
        {Object.entries(t as Obj).map(([k, tv]) => {
          const wide = typeof tv !== 'string' || LONG.test(k) || IMAGE.test(k) || depth > 0;
          return (
            <div key={k} className={cx(wide && 'sm:col-span-2')}>
              <span className="mb-1.5 block text-[12.5px] font-medium text-paper/75">{human(k)}</span>
              <ValueEditor name={k} value={v[k] ?? blankLike(tv)} template={tv} depth={depth + 1} onChange={(nv) => onChange({ ...v, [k]: nv })} />
            </div>
          );
        })}
      </div>
    );
  }
  return null;
}

function IconBtn({ children, label, onClick, disabled, danger }: { children: React.ReactNode; label: string; onClick: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <button type="button" aria-label={label} title={label} disabled={disabled} onClick={onClick}
      className={cx('grid size-7 place-items-center rounded-lg border border-white/10 text-[12px] text-paper/60 transition disabled:opacity-30', danger ? 'hover:border-rose hover:text-rose' : 'hover:border-white/30 hover:text-paper')}>
      {children}
    </button>
  );
}

/** Editor + hidden input carrying JSON for the server action */
export default function ObjectEditor({ name = 'payload', initial, template }: { name?: string; initial: Json; template: Json }) {
  const [value, setValue] = useState<Json>(initial);
  return (
    <>
      <input type="hidden" name={name} value={JSON.stringify(value)} />
      <ValueEditor name="root" value={value} template={template} onChange={setValue} />
    </>
  );
}
