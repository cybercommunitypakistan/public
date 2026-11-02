// =============================================================================
// FILE: components/admin/ui.tsx — admin design primitives (server-safe)
// Palette = the site's default ink/emerald tokens; admin never follows the
// public colour scheme so it always stays readable.
// =============================================================================
import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

export const inputCls =
  'w-full rounded-xl border border-white/10 bg-white/[0.035] px-3.5 py-2.5 text-[14px] text-paper placeholder:text-paper/30 outline-none transition focus:border-emerald/70 focus:bg-white/[0.06] focus:ring-4 focus:ring-emerald/10 disabled:opacity-50 aria-[invalid=true]:border-rose/70';

export function PageHeader({ title, eyebrow, description, actions }: { title: string; eyebrow?: ReactNode; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-emerald">{eyebrow}</div>}
        <h1 className="mt-1.5 font-display text-[34px] font-black uppercase leading-none tracking-[-0.035em] text-paper">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-[14px] text-paper/55">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, description, actions, children, className, padded = true }: { title?: string; description?: string; actions?: ReactNode; children?: ReactNode; className?: string; padded?: boolean }) {
  return (
    <section className={cx('rounded-2xl border border-white/[0.07] bg-ink-2/55 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset]', className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
          <div>
            {title && <h2 className="text-[15px] font-semibold text-paper">{title}</h2>}
            {description && <p className="mt-0.5 text-[13px] text-paper/50">{description}</p>}
          </div>
          {actions}
        </header>
      )}
      <div className={padded ? 'p-5' : ''}>{children}</div>
    </section>
  );
}

const btnBase = 'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13.5px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50';
const btnVariants = {
  primary: 'bg-emerald text-ink hover:bg-emerald-soft',
  secondary: 'border border-white/12 bg-white/[0.04] text-paper hover:border-white/25 hover:bg-white/[0.07]',
  ghost: 'text-paper/70 hover:bg-white/[0.05] hover:text-paper',
  danger: 'border border-rose/30 bg-rose/10 text-rose hover:bg-rose/20',
};
export type BtnVariant = keyof typeof btnVariants;
export const buttonCls = (v: BtnVariant = 'primary', extra = '') => cx(btnBase, btnVariants[v], extra);

export function Button({ variant = 'primary', className, ...p }: ComponentProps<'button'> & { variant?: BtnVariant }) {
  return <button {...p} className={buttonCls(variant, className)} />;
}
export function LinkButton({ variant = 'primary', className, ...p }: ComponentProps<typeof Link> & { variant?: BtnVariant }) {
  return <Link {...p} className={buttonCls(variant, className)} />;
}

export function Field({ label, hint, error, children, className }: { label: string; hint?: string; error?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cx('block', className)}>
      <span className="mb-1.5 block text-[12.5px] font-medium text-paper/75">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-[12px] text-rose">{error}</span> : hint ? <span className="mt-1 block text-[12px] text-paper/40">{hint}</span> : null}
    </label>
  );
}

export function Badge({ tone = 'neutral', children }: { tone?: 'neutral' | 'green' | 'amber' | 'red' | 'blue'; children: ReactNode }) {
  const tones = {
    neutral: 'border-white/12 text-paper/60',
    green: 'border-emerald/40 bg-emerald/10 text-emerald-soft',
    amber: 'border-amber-400/40 bg-amber-400/10 text-amber-200',
    red: 'border-rose/40 bg-rose/10 text-rose',
    blue: 'border-sky-400/40 bg-sky-400/10 text-sky-200',
  };
  return <span className={cx('inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em]', tones[tone])}>{children}</span>;
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-white/12 px-6 py-16 text-center">
      <div className="mb-4 grid size-12 place-items-center rounded-2xl bg-emerald/10 text-emerald">
        <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 5v14M5 12h14" /></svg>
      </div>
      <p className="text-[15px] font-semibold text-paper">{title}</p>
      {body && <p className="mt-1 max-w-sm text-[13px] text-paper/50">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-[13.5px]">
        <thead>
          <tr className="border-b border-white/[0.07]">
            {head.map((h) => <th key={h} className="px-5 py-3 font-mono text-[10px] font-normal uppercase tracking-[0.16em] text-paper/40">{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.05]">{children}</tbody>
      </table>
    </div>
  );
}
export const Td = ({ children, className }: { children?: ReactNode; className?: string }) => <td className={cx('px-5 py-3.5 align-middle text-paper/80', className)}>{children}</td>;

export function StatusDot({ on }: { on: boolean }) {
  return <span className={cx('inline-block size-2 rounded-full', on ? 'bg-emerald shadow-[0_0_10px] shadow-emerald' : 'bg-paper/25')} />;
}

export const fmtDate = (d: Date | string | null | undefined, withTime = false) =>
  d ? new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Karachi', day: '2-digit', month: 'short', year: 'numeric', ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}) }).format(new Date(d)) : '—';
