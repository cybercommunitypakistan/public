// =============================================================================
// FILE: components/admin/ActionForm.tsx
// <form> bound to a server action that returns ActionResult. Shows a status
// banner, field errors (via context) and disables the submit while pending.
// =============================================================================
'use client';

import { createContext, useActionState, useContext, useEffect, useRef, type ReactNode } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { buttonCls, type BtnVariant } from './ui';

export type ActionState = { ok: boolean; message?: string; error?: string; fieldErrors?: Record<string, string>; redirect?: string } | null;
type Action = (prev: ActionState, fd: FormData) => Promise<ActionState>;

const Ctx = createContext<ActionState>(null);
export const useFieldError = (name: string) => useContext(Ctx)?.fieldErrors?.[name];

export default function ActionForm({ action, children, className, resetOnSuccess = false }: { action: Action; children: ReactNode; className?: string; resetOnSuccess?: boolean }) {
  const [state, formAction] = useActionState<ActionState, FormData>(action, null);
  const ref = useRef<HTMLFormElement>(null);
  const router = useRouter();
  useEffect(() => {
    if (state?.ok && state.redirect) router.push(state.redirect);
    else if (state?.ok && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess, router]);
  return (
    <Ctx.Provider value={state}>
      <form ref={ref} action={formAction} className={className}>
        {state && (state.message || state.error) && (
          <div role={state.ok ? 'status' : 'alert'} className={`mb-5 flex items-start gap-3 rounded-xl border px-4 py-3 text-[13.5px] ${state.ok ? 'border-emerald/30 bg-emerald/10 text-emerald-soft' : 'border-rose/30 bg-rose/10 text-rose'}`}>
            <span aria-hidden className="mt-0.5">{state.ok ? '✓' : '!'}</span>
            <span>{state.ok ? state.message : state.error}</span>
          </div>
        )}
        {children}
      </form>
    </Ctx.Provider>
  );
}

export function SubmitButton({ children, variant = 'primary', className = '', pendingText = 'Saving…', name, value }: { children: ReactNode; variant?: BtnVariant; className?: string; pendingText?: string; name?: string; value?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" name={name} value={value} disabled={pending} className={buttonCls(variant, className)}>
      {pending ? <><span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />{pendingText}</> : children}
    </button>
  );
}

export function FieldError({ name }: { name: string }) {
  const e = useFieldError(name);
  return e ? <span className="mt-1 block text-[12px] text-rose">{e}</span> : null;
}
