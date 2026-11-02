// FILE: lib/admin/result.ts — helpers for admin server actions
import type { ActionState } from '@/components/admin/ActionForm';
import type { ZodError } from 'zod';

export const ok = (message = 'Saved.', redirect?: string): ActionState => ({ ok: true, message, redirect });
export const fail = (error: string, fieldErrors?: Record<string, string>): ActionState => ({ ok: false, error, fieldErrors });

export function zodFail(e: ZodError, fallback = 'Please fix the highlighted fields.'): ActionState {
  const fieldErrors: Record<string, string> = {};
  for (const i of e.issues) {
    const k = i.path.join('.');
    if (k && !fieldErrors[k]) fieldErrors[k] = i.message;
  }
  const first = e.issues[0];
  return fail(first ? `${first.path.length ? `${first.path.join(' › ')}: ` : ''}${first.message}` : fallback, fieldErrors);
}

export function readJson(fd: FormData, key = 'payload'): unknown {
  const raw = fd.get(key);
  if (typeof raw !== 'string' || raw.length > 1_000_000) throw new Error('Invalid data');
  return JSON.parse(raw);
}

export const str = (fd: FormData, k: string, max = 500) => String(fd.get(k) ?? '').trim().slice(0, max);
export const bool = (fd: FormData, k: string) => fd.get(k) === 'on' || fd.get(k) === 'true';
export const isId = (v: unknown): v is string => typeof v === 'string' && /^[a-f0-9]{24}$/.test(v);

/** <input type="datetime-local"> value (Pakistan time) → Date. '' → null, bad → NaN date */
export function pktDate(v: string): Date | null {
  if (!v) return null;
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v) ? new Date(`${v}:00+05:00`) : new Date(v);
}
