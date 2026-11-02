// FILE: app/admin/login/LoginForm.tsx
'use client';

import { useActionState, useState } from 'react';
import { login } from '../_actions/auth';
import type { ActionState } from '@/components/admin/ActionForm';
import { inputCls } from '@/components/admin/ui';

export default function LoginForm({ token, trapName, timingName }: { token: string; trapName: string; timingName: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(login, null);
  const [show, setShow] = useState(false);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name={timingName} value={token} />
      <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
        <label>Website<input type="text" name={trapName} tabIndex={-1} autoComplete="off" /></label>
      </div>
      {state && !state.ok && <p role="alert" className="rounded-xl border border-rose/30 bg-rose/10 px-3.5 py-2.5 text-[13px] text-rose">{state.error}</p>}
      <label className="block">
        <span className="mb-1.5 block text-[12.5px] font-medium text-paper/70">Email</span>
        <input name="email" type="email" autoComplete="username" required autoFocus className={inputCls} />
      </label>
      <label className="block">
        <span className="mb-1.5 flex justify-between text-[12.5px] font-medium text-paper/70">Password
          <button type="button" onClick={() => setShow((s) => !s)} className="text-[11.5px] text-paper/40 hover:text-paper">{show ? 'Hide' : 'Show'}</button>
        </span>
        <input name="password" type={show ? 'text' : 'password'} autoComplete="current-password" required className={inputCls} />
      </label>
      <button disabled={pending} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald py-3 text-[14px] font-bold text-ink transition hover:bg-emerald-soft disabled:opacity-60">
        {pending ? <span className="size-4 animate-spin rounded-full border-2 border-ink border-t-transparent" /> : null}
        {pending ? 'Checking…' : 'Sign in'}
      </button>
    </form>
  );
}
