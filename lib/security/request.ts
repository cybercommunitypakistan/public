// =============================================================================
// FILE: lib/security/request.ts — client IP + user agent from the request headers
//
// IP source (anti-spoofing): a client can put anything in X-Forwarded-For, but
// the RIGHT-most entry is the one appended by your own reverse proxy, so that's
// the default. Behind a provider that sets a dedicated header, name it:
//   IP_HEADER=cf-connecting-ip   (Cloudflare)
//   IP_HEADER=x-real-ip          (Vercel, or Nginx with proxy_set_header X-Real-IP)
// Never point IP_HEADER at a header your proxy doesn't overwrite.
// =============================================================================
import 'server-only';
import { headers } from 'next/headers';

const VALID = /^[0-9a-f.:]{3,45}$/i;

export async function requestInfo() {
  const h = await headers();
  const named = process.env.IP_HEADER || (process.env.VERCEL === '1' ? 'x-real-ip' : '');
  const candidates = [
    named ? h.get(named)?.trim() : null,
    h.get('x-forwarded-for')?.split(',').map((s) => s.trim()).filter(Boolean).pop(),
    h.get('x-real-ip')?.trim(),
  ];
  const ip = (candidates.find((c) => c && VALID.test(c)) ?? '0.0.0.0').replace(/^::ffff:/, '');
  const userAgent = (h.get('user-agent') || '').slice(0, 300);
  const path = (h.get('x-pathname') || h.get('referer') || '').slice(0, 300);
  return { ip, userAgent, path };
}
