// =============================================================================
// FILE: lib/security/crypto.ts — hashing, random tokens, HMAC-signed values
// =============================================================================
import 'server-only';
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    if (process.env.NODE_ENV === 'production') throw new Error('SESSION_SECRET must be set (32+ random characters)');
    return 'dev-only-insecure-secret-change-me-0000000000';
  }
  return s;
}

export const sha256 = (v: string) => createHash('sha256').update(v).digest('hex');
export const randomToken = (bytes = 32) => randomBytes(bytes).toString('base64url');
export const hmac = (v: string) => createHmac('sha256', secret()).update(v).digest('base64url');

export function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** "payload.signature" — tamper-evident, not secret */
export const sign = (payload: string) => `${payload}.${hmac(payload)}`;
export function unsign(token: string): string | null {
  const i = token.lastIndexOf('.');
  if (i < 1) return null;
  const payload = token.slice(0, i);
  return safeEqual(token.slice(i + 1), hmac(payload)) ? payload : null;
}

/** salted hash so submissions can be rate-checked without storing raw IPs */
export const hashIp = (ip: string) => hmac(`ip:${ip}`).slice(0, 32);
