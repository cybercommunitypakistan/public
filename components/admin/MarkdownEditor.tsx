// FILE: components/admin/MarkdownEditor.tsx — write / preview tabs + quick formatting
'use client';

import { useRef, useState } from 'react';
import Markdown from '@/components/cms/Markdown';
import { inputCls, cx } from './ui';

const TOOLS: [string, string, string][] = [['B', '**', '**'], ['I', '_', '_'], ['H2', '\n## ', ''], ['H3', '\n### ', ''], ['Link', '[', '](https://)'], ['List', '\n- ', ''], ['Quote', '\n> ', ''], ['Code', '`', '`']];

export default function MarkdownEditor({ name, defaultValue = '', rows = 22 }: { name: string; defaultValue?: string; rows?: number }) {
  const [value, setValue] = useState(defaultValue);
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const ta = useRef<HTMLTextAreaElement>(null);
  const wrap = (a: string, b: string) => {
    const el = ta.current; if (!el) return;
    const { selectionStart: s, selectionEnd: e } = el;
    const next = value.slice(0, s) + a + value.slice(s, e) + b + value.slice(e);
    setValue(next);
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(s + a.length, e + a.length); });
  };
  const words = value.trim() ? value.trim().split(/\s+/).length : 0;
  return (
    <div className="overflow-hidden rounded-xl border border-white/10">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-black/20 px-2 py-1.5">
        <div className="flex gap-1">
          {(['write', 'preview'] as const).map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)} className={cx('rounded-lg px-3 py-1 text-[12.5px] capitalize', tab === t ? 'bg-white/10 text-paper' : 'text-paper/50 hover:text-paper')}>{t}</button>
          ))}
        </div>
        {tab === 'write' && (
          <div className="flex flex-wrap gap-1">
            {TOOLS.map(([l, a, b]) => <button key={l} type="button" onClick={() => wrap(a, b)} className="rounded-md px-2 py-1 font-mono text-[11px] text-paper/60 hover:bg-white/10 hover:text-paper">{l}</button>)}
          </div>
        )}
        <span className="px-2 font-mono text-[10.5px] text-paper/35">{words} words · {Math.max(1, Math.round(words / 220))} min</span>
      </div>
      <textarea ref={ta} name={name} value={value} onChange={(e) => setValue(e.target.value)} rows={rows} hidden={tab !== 'write'}
        className={cx(inputCls, 'rounded-none border-0 font-mono text-[13.5px] leading-relaxed focus:ring-0')} placeholder="Write in Markdown…" />
      {tab === 'preview' && <div className="max-h-[70vh] overflow-auto bg-ink p-6"><Markdown>{value || '_Nothing yet._'}</Markdown></div>}
    </div>
  );
}
