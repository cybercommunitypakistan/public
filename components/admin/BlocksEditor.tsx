// =============================================================================
// FILE: components/admin/BlocksEditor.tsx — page builder: add, reorder, edit, remove blocks
// =============================================================================
'use client';

import { useState } from 'react';
import { BLOCKS, BLOCK_TYPES, type BlockType } from '@/lib/blocks/registry';
import { ValueEditor } from './ObjectEditor';
import { cx } from './ui';

type B = { id: string; type: string; data: Record<string, unknown> };
const uid = () => (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`).replace(/[^a-z0-9-]/gi, '').slice(0, 36);

export default function BlocksEditor({ initial }: { initial: B[] }) {
  const [blocks, setBlocks] = useState<B[]>(initial);
  const [open, setOpen] = useState<string | null>(initial[0]?.id ?? null);
  const [picker, setPicker] = useState(false);

  const add = (type: BlockType) => {
    const b = { id: uid(), type, data: JSON.parse(JSON.stringify(BLOCKS[type].defaults)) };
    setBlocks((x) => [...x, b]); setOpen(b.id); setPicker(false);
  };
  const move = (i: number, d: number) => setBlocks((x) => { const n = [...x]; const [b] = n.splice(i, 1); n.splice(i + d, 0, b); return n; });
  const dup = (i: number) => setBlocks((x) => { const n = [...x]; n.splice(i + 1, 0, { ...x[i], id: uid(), data: JSON.parse(JSON.stringify(x[i].data)) }); return n; });

  return (
    <div>
      <input type="hidden" name="blocks" value={JSON.stringify(blocks)} />
      <div className="space-y-3">
        {blocks.map((b, i) => {
          const def = BLOCKS[b.type as BlockType];
          const isOpen = open === b.id;
          const summary = String((b.data.title as string) || (b.data.markdown as string)?.slice(0, 60) || (b.data.formSlug as string) || '');
          return (
            <div key={b.id} className={cx('rounded-2xl border transition', isOpen ? 'border-emerald/40 bg-ink-2/70' : 'border-white/[0.08] bg-ink-2/40')}>
              <div className="flex items-center gap-3 px-4 py-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/[0.05] font-mono text-[11px] text-paper/50">{i + 1}</span>
                <button type="button" onClick={() => setOpen(isOpen ? null : b.id)} className="min-w-0 flex-1 text-left">
                  <span className="block text-[13.5px] font-semibold">{def?.label ?? b.type}</span>
                  <span className="block truncate text-[12px] text-paper/45">{summary || def?.description}</span>
                </button>
                <div className="flex gap-1">
                  {[['↑', () => move(i, -1), i === 0, 'Move up'], ['↓', () => move(i, 1), i === blocks.length - 1, 'Move down'], ['⧉', () => dup(i), false, 'Duplicate']].map(([l, fn, dis, t]) => (
                    <button key={t as string} type="button" title={t as string} aria-label={t as string} disabled={dis as boolean} onClick={fn as () => void} className="grid size-8 place-items-center rounded-lg border border-white/10 text-[12px] text-paper/60 hover:border-white/30 hover:text-paper disabled:opacity-25">{l as string}</button>
                  ))}
                  <button type="button" title="Remove" aria-label="Remove" onClick={() => confirm('Remove this block?') && setBlocks((x) => x.filter((y) => y.id !== b.id))} className="grid size-8 place-items-center rounded-lg border border-white/10 text-[12px] text-paper/60 hover:border-rose hover:text-rose">✕</button>
                </div>
              </div>
              {isOpen && def && (
                <div className="border-t border-white/[0.06] p-5">
                  <ValueEditor name="root" value={b.data as never} template={def.defaults as never} onChange={(v) => setBlocks((x) => x.map((y) => (y.id === b.id ? { ...y, data: v as Record<string, unknown> } : y)))} />
                </div>
              )}
            </div>
          );
        })}
      </div>
      {picker ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="mb-3 flex items-center justify-between"><p className="text-[13px] font-semibold">Add a block</p><button type="button" onClick={() => setPicker(false)} className="text-[12px] text-paper/50 hover:text-paper">Cancel</button></div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {BLOCK_TYPES.map((t) => (
              <button key={t} type="button" onClick={() => add(t)} className="rounded-xl border border-white/[0.08] p-3 text-left transition hover:border-emerald/60 hover:bg-emerald/5">
                <span className="block text-[13px] font-semibold">{BLOCKS[t].label}</span>
                <span className="text-[11.5px] text-paper/45">{BLOCKS[t].description}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setPicker(true)} className="mt-4 w-full rounded-2xl border border-dashed border-white/15 py-4 text-[13.5px] text-paper/60 transition hover:border-emerald hover:text-emerald">+ Add block</button>
      )}
    </div>
  );
}
