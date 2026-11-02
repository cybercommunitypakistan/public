// =============================================================================
// FILE: components/admin/FormBuilder.tsx — Google-Forms-style builder
// Left: questions (add, edit inline, reorder, duplicate, delete). Right:
// settings + live preview. Saved as JSON and validated on the server.
// =============================================================================
'use client';

import { useMemo, useState } from 'react';
import { FIELD_LABELS, FIELD_TYPES, HAS_OPTIONS, type FieldType, type FormField } from '@/lib/forms/schema';
import ActionForm, { SubmitButton } from './ActionForm';
import { Card, Field, cx, inputCls } from './ui';
import type { ActionState } from './ActionForm';

type Def = {
  title: string; slug: string; description: string; status: 'open' | 'closed'; successMessage: string; submitLabel: string;
  uniqueEmail: boolean; limit: number; closesAt: string; notifyEmail: string; fields: FormField[];
};

const ICON: Record<FieldType, string> = { short_text: 'Aa', long_text: '¶', email: '@', phone: '☏', number: '#', url: '↗', date: '📅', time: '⏱', select: '▾', radio: '◉', checkbox: '☑', consent: '✓', heading: 'H' };
const idFrom = (label: string, taken: string[]) => {
  const base = label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 30) || 'q';
  let id = base.length < 2 ? `${base}_q` : base, n = 2;
  while (taken.includes(id)) id = `${base}_${n++}`;
  return id;
};
const blank = (type: FieldType, taken: string[]): FormField => ({
  id: idFrom(FIELD_LABELS[type], taken), type, label: type === 'heading' ? 'New section' : type === 'consent' ? 'I agree to the code of conduct' : 'Untitled question',
  help: '', placeholder: '', required: type !== 'heading', options: HAS_OPTIONS.includes(type) ? ['Option 1', 'Option 2'] : [], min: null, max: null, width: 'full',
});

export default function FormBuilder({ id, initial, action }: { id: string; initial: Def; action: (p: ActionState, fd: FormData) => Promise<ActionState> }) {
  const [def, setDef] = useState<Def>(initial);
  const [sel, setSel] = useState<number | null>(0);
  const [adding, setAdding] = useState(false);
  const set = <K extends keyof Def>(k: K, v: Def[K]) => setDef((d) => ({ ...d, [k]: v }));
  const setField = (i: number, patch: Partial<FormField>) => setDef((d) => ({ ...d, fields: d.fields.map((f, j) => (j === i ? { ...f, ...patch } : f)) }));
  const ids = useMemo(() => def.fields.map((f) => f.id), [def.fields]);

  const add = (t: FieldType) => { setDef((d) => ({ ...d, fields: [...d.fields, blank(t, ids)] })); setSel(def.fields.length); setAdding(false); };
  const move = (i: number, dir: number) => { setDef((d) => { const f = [...d.fields]; const [x] = f.splice(i, 1); f.splice(i + dir, 0, x); return { ...d, fields: f }; }); setSel(i + dir); };
  const dup = (i: number) => setDef((d) => { const f = [...d.fields]; f.splice(i + 1, 0, { ...d.fields[i], id: idFrom(d.fields[i].label, ids), options: [...d.fields[i].options] }); return { ...d, fields: f }; });

  return (
    <ActionForm action={action} className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="payload" value={JSON.stringify(def)} />

      <div className="space-y-3">
        <div className="rounded-2xl border border-white/[0.08] border-t-4 border-t-emerald bg-ink-2/60 p-6">
          <input value={def.title} onChange={(e) => set('title', e.target.value)} placeholder="Form title" aria-label="Form title" className="w-full bg-transparent font-display text-3xl font-black uppercase tracking-tight outline-none placeholder:text-paper/20" />
          <textarea value={def.description} onChange={(e) => set('description', e.target.value)} placeholder="Description (Markdown)" aria-label="Description" rows={2} className="mt-3 w-full resize-none bg-transparent text-[14.5px] text-paper/70 outline-none placeholder:text-paper/25" />
        </div>

        {def.fields.map((f, i) => {
          const active = sel === i;
          return (
            <div key={`${f.id}-${i}`} onClick={() => setSel(i)} className={cx('relative rounded-2xl border bg-ink-2/50 transition', active ? 'border-emerald/50 shadow-[inset_4px_0_0_0] shadow-emerald' : 'border-white/[0.07] hover:border-white/15')}>
              {!active ? (
                <div className="flex items-center gap-4 px-5 py-4">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/[0.05] text-[13px] text-paper/60">{ICON[f.type]}</span>
                  <span className="min-w-0 flex-1">
                    <span className={cx('block truncate text-[14px]', f.type === 'heading' ? 'font-display font-black uppercase' : 'font-medium')}>{f.label}{f.required && f.type !== 'heading' && <span className="text-emerald"> *</span>}</span>
                    <span className="font-mono text-[10.5px] uppercase tracking-wider text-paper/35">{FIELD_LABELS[f.type]}{f.options.length ? ` · ${f.options.length} options` : ''}</span>
                  </span>
                </div>
              ) : (
                <div className="space-y-4 p-5">
                  <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
                    <input value={f.label} onChange={(e) => setField(i, { label: e.target.value })} aria-label="Question" className={cx(inputCls, 'text-[15px]')} />
                    <select value={f.type} onChange={(e) => { const t = e.target.value as FieldType; setField(i, { type: t, options: HAS_OPTIONS.includes(t) ? (f.options.length ? f.options : ['Option 1']) : [] }); }} className={inputCls} aria-label="Type">
                      {FIELD_TYPES.map((t) => <option key={t} value={t}>{ICON[t]}  {FIELD_LABELS[t]}</option>)}
                    </select>
                  </div>
                  <input value={f.help} onChange={(e) => setField(i, { help: e.target.value })} placeholder="Help text (optional)" aria-label="Help text" className={cx(inputCls, 'text-[13px]')} />
                  {HAS_OPTIONS.includes(f.type) && (
                    <div className="space-y-2">
                      {f.options.map((o, k) => (
                        <div key={k} className="flex items-center gap-2">
                          <span className="w-5 text-center text-paper/35">{f.type === 'checkbox' ? '☐' : f.type === 'radio' ? '○' : `${k + 1}.`}</span>
                          <input value={o} onChange={(e) => setField(i, { options: f.options.map((x, j) => (j === k ? e.target.value : x)) })} aria-label={`Option ${k + 1}`} className={cx(inputCls, 'py-2')} />
                          <button type="button" aria-label="Remove option" onClick={() => setField(i, { options: f.options.filter((_, j) => j !== k) })} className="px-2 text-paper/40 hover:text-rose">✕</button>
                        </div>
                      ))}
                      <button type="button" onClick={() => setField(i, { options: [...f.options, `Option ${f.options.length + 1}`] })} className="ml-7 text-[12.5px] text-emerald hover:underline">+ Add option</button>
                    </div>
                  )}
                  {['short_text', 'long_text', 'email', 'phone', 'url', 'number', 'select'].includes(f.type) && (
                    <input value={f.placeholder} onChange={(e) => setField(i, { placeholder: e.target.value })} placeholder="Placeholder (optional)" aria-label="Placeholder" className={cx(inputCls, 'text-[13px]')} />
                  )}
                  {['short_text', 'long_text', 'number'].includes(f.type) && (
                    <div className="grid grid-cols-2 gap-3">
                      <input type="number" value={f.min ?? ''} onChange={(e) => setField(i, { min: e.target.value === '' ? null : Number(e.target.value) })} placeholder={f.type === 'number' ? 'Min value' : 'Min length'} aria-label="Minimum" className={cx(inputCls, 'text-[13px]')} />
                      <input type="number" value={f.max ?? ''} onChange={(e) => setField(i, { max: e.target.value === '' ? null : Number(e.target.value) })} placeholder={f.type === 'number' ? 'Max value' : 'Max length'} aria-label="Maximum" className={cx(inputCls, 'text-[13px]')} />
                    </div>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-4">
                    <div className="flex items-center gap-4 text-[12.5px] text-paper/70">
                      {f.type !== 'heading' && <label className="flex items-center gap-2"><input type="checkbox" checked={f.required} onChange={(e) => setField(i, { required: e.target.checked })} className="size-4 accent-[var(--color-emerald)]" />Required</label>}
                      <label className="flex items-center gap-2"><input type="checkbox" checked={f.width === 'half'} onChange={(e) => setField(i, { width: e.target.checked ? 'half' : 'full' })} className="size-4 accent-[var(--color-emerald)]" />Half width</label>
                      <span className="font-mono text-[10.5px] text-paper/30">id: {f.id}</span>
                    </div>
                    <div className="flex gap-1">
                      {[['↑', () => move(i, -1), i === 0], ['↓', () => move(i, 1), i === def.fields.length - 1], ['⧉', () => dup(i), false]].map(([l, fn, dis]) => (
                        <button key={l as string} type="button" disabled={dis as boolean} onClick={(e) => { e.stopPropagation(); (fn as () => void)(); }} className="grid size-8 place-items-center rounded-lg border border-white/10 text-[12px] text-paper/60 hover:border-white/30 disabled:opacity-25">{l as string}</button>
                      ))}
                      <button type="button" onClick={(e) => { e.stopPropagation(); setDef((d) => ({ ...d, fields: d.fields.filter((_, j) => j !== i) })); setSel(null); }} className="grid size-8 place-items-center rounded-lg border border-white/10 text-[12px] text-paper/60 hover:border-rose hover:text-rose" aria-label="Delete question">✕</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {adding ? (
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {FIELD_TYPES.map((t) => (
                <button key={t} type="button" onClick={() => add(t)} className="flex items-center gap-2 rounded-xl border border-white/[0.08] px-3 py-2.5 text-left text-[12.5px] hover:border-emerald/60 hover:bg-emerald/5">
                  <span className="w-5 text-center text-paper/50">{ICON[t]}</span>{FIELD_LABELS[t]}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setAdding(true)} className="w-full rounded-2xl border border-dashed border-white/15 py-4 text-[13.5px] text-paper/60 transition hover:border-emerald hover:text-emerald">+ Add question</button>
        )}
      </div>

      <div className="space-y-6 xl:sticky xl:top-8 xl:self-start">
        <Card title="Settings">
          <div className="grid gap-4">
            <Field label="URL" hint={`/forms/${def.slug || '…'}`}><input value={def.slug} onChange={(e) => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} className={cx(inputCls, 'font-mono text-[13px]')} /></Field>
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-white/[0.04] p-1">
              {(['open', 'closed'] as const).map((s) => <button key={s} type="button" onClick={() => set('status', s)} className={cx('rounded-lg py-2 text-[12.5px] capitalize', def.status === s ? 'bg-emerald font-semibold text-ink' : 'text-paper/60')}>{s === 'open' ? 'Accepting' : 'Closed'}</button>)}
            </div>
            <Field label="Submit button"><input value={def.submitLabel} onChange={(e) => set('submitLabel', e.target.value)} className={inputCls} /></Field>
            <Field label="Message after submitting"><textarea value={def.successMessage} onChange={(e) => set('successMessage', e.target.value)} rows={2} className={inputCls} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Max responses" hint="0 = no limit"><input type="number" min={0} value={def.limit} onChange={(e) => set('limit', Number(e.target.value) || 0)} className={inputCls} /></Field>
              <Field label="Closes (PKT)"><input type="datetime-local" value={def.closesAt} onChange={(e) => set('closesAt', e.target.value)} className={inputCls} /></Field>
            </div>
            <label className="flex items-center gap-3 text-[13px] text-paper/75"><input type="checkbox" checked={def.uniqueEmail} onChange={(e) => set('uniqueEmail', e.target.checked)} className="size-4 accent-[var(--color-emerald)]" />One response per email</label>
            <Field label="Notify email" hint="Optional — needs RESEND_API_KEY"><input type="email" value={def.notifyEmail} onChange={(e) => set('notifyEmail', e.target.value)} className={inputCls} /></Field>
            <SubmitButton className="w-full">Save form</SubmitButton>
          </div>
        </Card>
        <p className="px-1 text-[12px] leading-relaxed text-paper/40">Every public form is protected by a hidden honeypot field, a minimum fill time, per-IP rate limits and server-side validation.</p>
      </div>
    </ActionForm>
  );
}
