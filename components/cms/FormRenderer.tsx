// =============================================================================
// FILE: components/cms/FormRenderer.tsx
// Renders a form built in the admin panel + honeypot + signed timing token.
// Validation runs again on the server (lib/forms/submit.ts) — the browser
// checks here are only for convenience.
// =============================================================================
'use client';

import { useActionState } from 'react';
import { submitForm, type SubmitState } from '@/lib/forms/submit';
import type { FormField } from '@/lib/forms/schema';

const input = 'w-full rounded-xl border border-paper/15 bg-paper/[0.04] px-4 py-3 text-[15px] text-paper placeholder:text-paper/35 outline-none transition focus:border-emerald focus:bg-paper/[0.07] focus:ring-4 focus:ring-emerald/15 aria-[invalid=true]:border-rose';

export default function FormRenderer({ formId, eventId, fields, submitLabel, token, trapName, timingName }: {
  formId: string; eventId?: string; fields: FormField[]; submitLabel: string; token: string; trapName: string; timingName: string;
}) {
  const [state, action, pending] = useActionState<SubmitState, FormData>(submitForm, { status: 'idle', message: '' });

  if (state.status === 'success') {
    return (
      <div role="status" className="rounded-2xl border border-emerald/40 bg-emerald/10 p-8 text-paper">
        <div className="mb-4 grid size-12 place-items-center rounded-full bg-emerald text-ink">
          <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="m5 12 5 5 9-10" /></svg>
        </div>
        <p className="font-display text-2xl font-black uppercase tracking-tight">Done.</p>
        <p className="mt-2 text-paper/75">{state.message}</p>
      </div>
    );
  }

  const err = (id: string) => state.fieldErrors?.[id];

  return (
    <form action={action} noValidate className="grid grid-cols-2 gap-x-5 gap-y-6">
      <input type="hidden" name="_form" value={formId} />
      {eventId && <input type="hidden" name="_event" value={eventId} />}
      <input type="hidden" name={timingName} value={token} />
      {/* honeypot: invisible to people and screen readers, irresistible to bots */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
        <label>Website <input type="text" name={trapName} tabIndex={-1} autoComplete="off" defaultValue="" /></label>
      </div>

      {fields.map((f) => {
        const span = f.width === 'half' ? 'col-span-2 sm:col-span-1' : 'col-span-2';
        if (f.type === 'heading') {
          return (
            <div key={f.id} className="col-span-2 mt-4 border-t border-paper/10 pt-6">
              <p className="font-display text-xl font-black uppercase tracking-tight">{f.label}</p>
              {f.help && <p className="mt-1 text-sm text-paper/60">{f.help}</p>}
            </div>
          );
        }
        const id = `f_${f.id}`;
        const invalid = Boolean(err(f.id));
        const label = (
          <span className="mb-2 block text-[13px] font-medium text-paper/85">
            {f.label}{f.required && <span className="ml-1 text-emerald" aria-hidden>*</span>}
          </span>
        );
        const help = f.help ? <span id={`${id}_h`} className="mt-1.5 block text-[12.5px] text-paper/50">{f.help}</span> : null;
        const error = invalid ? <span className="mt-1.5 block text-[12.5px] font-medium text-rose">{err(f.id)}</span> : null;
        const common = { id, name: id, required: f.required, 'aria-invalid': invalid, 'aria-describedby': f.help ? `${id}_h` : undefined };

        if (f.type === 'radio' || f.type === 'checkbox') {
          return (
            <fieldset key={f.id} className={span} aria-invalid={invalid}>
              <legend className="mb-2 text-[13px] font-medium text-paper/85">{f.label}{f.required && <span className="ml-1 text-emerald">*</span>}</legend>
              <div className="grid gap-2">
                {f.options.map((o) => (
                  <label key={o} className="flex cursor-pointer items-center gap-3 rounded-xl border border-paper/10 px-4 py-3 text-[15px] transition hover:border-paper/30 has-[:checked]:border-emerald has-[:checked]:bg-emerald/10">
                    <input type={f.type} name={id} value={o} className="size-4 accent-[var(--color-emerald)]" />
                    {o}
                  </label>
                ))}
              </div>
              {help}{error}
            </fieldset>
          );
        }
        if (f.type === 'consent') {
          return (
            <div key={f.id} className="col-span-2">
              <label className="flex cursor-pointer items-start gap-3 text-[14.5px] text-paper/80">
                <input type="checkbox" {...common} className="mt-1 size-4 accent-[var(--color-emerald)]" />
                <span>{f.label}{f.required && <span className="ml-1 text-emerald">*</span>}</span>
              </label>
              {help}{error}
            </div>
          );
        }
        let control: React.ReactNode;
        if (f.type === 'long_text') control = <textarea {...common} rows={5} placeholder={f.placeholder} maxLength={f.max ?? 5000} className={input} />;
        else if (f.type === 'select') control = (
          <select {...common} defaultValue="" className={input}>
            <option value="" disabled>{f.placeholder || 'Choose…'}</option>
            {f.options.map((o) => <option key={o} value={o} className="bg-ink">{o}</option>)}
          </select>
        );
        else {
          const type = { short_text: 'text', email: 'email', phone: 'tel', number: 'number', url: 'url', date: 'date', time: 'time' }[f.type] ?? 'text';
          const auto = f.type === 'email' ? 'email' : f.type === 'phone' ? 'tel' : undefined;
          control = <input {...common} type={type} autoComplete={auto} placeholder={f.placeholder} maxLength={f.type === 'short_text' ? f.max ?? 300 : undefined} min={f.type === 'number' ? f.min ?? undefined : undefined} max={f.type === 'number' ? f.max ?? undefined : undefined} className={input} />;
        }
        return <label key={f.id} htmlFor={id} className={span}>{label}{control}{help}{error}</label>;
      })}

      {state.status === 'error' && <p role="alert" className="col-span-2 rounded-xl border border-rose/40 bg-rose/10 px-4 py-3 text-sm text-paper">{state.message}</p>}

      <div className="col-span-2">
        <button disabled={pending} className="group inline-flex items-center gap-3 rounded-full bg-emerald px-7 py-4 font-display text-sm font-black uppercase tracking-wide text-ink transition hover:bg-emerald-soft disabled:opacity-60">
          {pending ? 'Sending…' : submitLabel}
          <svg viewBox="0 0 24 24" className="size-4 transition group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </button>
      </div>
    </form>
  );
}
