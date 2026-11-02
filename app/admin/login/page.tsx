// FILE: app/admin/login/page.tsx
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { HONEYPOT_FIELD, TIMING_FIELD, issueFormToken } from '@/lib/security/guard';
import { hasDatabase } from '@/lib/db';
import LoginForm from './LoginForm';

export const metadata = { title: 'Sign in' };

export default async function LoginPage() {
  if (hasDatabase && (await getCurrentUser())) redirect('/admin');
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-16">
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(var(--color-paper)_1px,transparent_1px),linear-gradient(90deg,var(--color-paper)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(60%_50%_at_50%_40%,#000,transparent)]" />
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-[-260px] size-[620px] -translate-x-1/2 rounded-full bg-emerald/20 blur-[140px]" />
      <div className="relative w-full max-w-[400px]">
        <div className="mb-8 text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl border border-emerald/30 bg-emerald/10 text-emerald shadow-[0_0_40px] shadow-emerald/20">
            <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6l-8-3Z" /><path d="m9 12 2 2 4-4" /></svg>
          </div>
          <h1 className="mt-5 font-display text-3xl font-black uppercase tracking-[-0.03em]">CCP Control Room</h1>
          <p className="mt-1.5 text-[13.5px] text-paper/50">Authorised staff only. Every sign-in is logged.</p>
        </div>
        <div className="rounded-3xl border border-white/[0.08] bg-ink-2/70 p-7 shadow-2xl shadow-black/40 backdrop-blur">
          {hasDatabase ? <LoginForm token={issueFormToken()} trapName={HONEYPOT_FIELD} timingName={TIMING_FIELD} />
            : <p className="text-sm text-rose">MONGODB_URI is not set — the admin panel needs a database.</p>}
        </div>
        <p className="mt-6 text-center font-mono text-[10.5px] uppercase tracking-[0.2em] text-paper/30">Sessions expire after 8h idle · TLS only in production</p>
      </div>
    </main>
  );
}
