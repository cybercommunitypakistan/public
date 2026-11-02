// FILE: app/admin/(panel)/events/[id]/RegistrationFields.tsx
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { FieldError } from '@/components/admin/ActionForm';
import { Field, inputCls } from '@/components/admin/ui';

export default function RegistrationFields({ forms, initial }: { forms: { id: string; title: string }[]; initial: { registration: string; form: string; href: string; capacity: number; closesAt: string; waitlist: boolean } }) {
  const [mode, setMode] = useState(initial.registration);
  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-3 gap-1 rounded-xl bg-white/[0.04] p-1">
        {[['form', 'On site'], ['external', 'External'], ['none', 'None']].map(([v, l]) => (
          <label key={v} className={`cursor-pointer rounded-lg py-2 text-center text-[12.5px] ${mode === v ? 'bg-emerald text-ink font-semibold' : 'text-paper/60'}`}>
            <input type="radio" name="registration" value={v} checked={mode === v} onChange={() => setMode(v)} className="sr-only" />{l}
          </label>
        ))}
      </div>
      {mode === 'form' && (
        <>
          <Field label="Registration form">
            <select name="form" defaultValue={initial.form} className={inputCls}>
              <option value="">Choose a form…</option>
              {forms.map((f) => <option key={f.id} value={f.id}>{f.title}</option>)}
            </select>
            <FieldError name="form" />
          </Field>
          <Link href="/admin/forms/new" target="_blank" className="-mt-2 text-[12px] text-emerald hover:underline">+ Build a new form</Link>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Capacity" hint="0 = unlimited"><input type="number" name="capacity" min={0} defaultValue={initial.capacity} className={inputCls} /></Field>
            <label className="mt-6 flex items-center gap-2 text-[12.5px] text-paper/75"><input type="checkbox" name="waitlist" defaultChecked={initial.waitlist} className="size-4 accent-[var(--color-emerald)]" />Waitlist when full</label>
          </div>
          <Field label="Registration closes (PKT)"><input type="datetime-local" name="registrationClosesAt" defaultValue={initial.closesAt} className={inputCls} /></Field>
        </>
      )}
      {mode === 'external' && <Field label="Registration link" hint="Google Form, Luma, Eventbrite…"><input type="url" name="href" defaultValue={initial.href} className={inputCls} /><FieldError name="href" /></Field>}
      {mode !== 'form' && <><input type="hidden" name="form" value="" /><input type="hidden" name="capacity" value="0" /></>}
    </div>
  );
}
