// FILE: components/admin/ImageField.tsx — paste a URL or upload to Cloudinary
'use client';

import { useRef, useState } from 'react';
import { inputCls } from './ui';

export default function ImageField({ name, defaultValue = '', value, onChange, label = 'Image' }: {
  name?: string; defaultValue?: string; value?: string; onChange?: (url: string, meta?: { width: number; height: number; publicId: string }) => void; label?: string;
}) {
  const [inner, setInner] = useState(defaultValue);
  const url = value ?? inner;
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const file = useRef<HTMLInputElement>(null);
  const set = (u: string, meta?: { width: number; height: number; publicId: string }) => { setInner(u); onChange?.(u, meta); };

  async function upload(f: File) {
    setBusy(true); setErr('');
    try {
      const fd = new FormData(); fd.append('file', f);
      const r = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Upload failed');
      set(j.url, { width: j.width, height: j.height, publicId: j.publicId });
    } catch (e) { setErr(e instanceof Error ? e.message : 'Upload failed'); } finally { setBusy(false); }
  }

  return (
    <div>
      <div className="flex items-stretch gap-3">
        <div className="grid size-[74px] shrink-0 place-items-center overflow-hidden rounded-xl border border-white/10 bg-[conic-gradient(at_50%_50%,#ffffff08_25%,transparent_0_50%,#ffffff08_0_75%,transparent_0)] bg-[length:14px_14px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {url ? <img src={url} alt="" className="size-full object-contain" /> : <span className="font-mono text-[10px] text-paper/30">none</span>}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <input aria-label={`${label} URL`} name={name} value={url} onChange={(e) => set(e.target.value)} placeholder="https://res.cloudinary.com/… or /image.png" className={inputCls} />
          <div className="flex gap-2">
            <button type="button" disabled={busy} onClick={() => file.current?.click()} className="rounded-lg border border-white/12 px-3 py-1.5 text-[12.5px] text-paper/80 hover:border-emerald hover:text-emerald disabled:opacity-50">{busy ? 'Uploading…' : 'Upload'}</button>
            {url && <button type="button" onClick={() => set('')} className="rounded-lg px-3 py-1.5 text-[12.5px] text-paper/50 hover:text-rose">Remove</button>}
          </div>
        </div>
      </div>
      <input ref={file} type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ''; }} />
      {err && <p className="mt-1.5 text-[12px] text-rose">{err}</p>}
    </div>
  );
}
