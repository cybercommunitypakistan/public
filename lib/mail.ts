// =============================================================================
// FILE: lib/mail.ts — optional email via Resend (set RESEND_API_KEY + MAIL_FROM)
// =============================================================================
import 'server-only';
import { Resend } from 'resend';

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export async function sendMail(to: string, subject: string, lines: string[]) {
  const key = process.env.RESEND_API_KEY, from = process.env.MAIL_FROM;
  if (!key || !from || !to) return false;
  try {
    const html = `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.6;color:#071a2b">${lines.map((l) => `<p>${esc(l)}</p>`).join('')}</div>`;
    await new Resend(key).emails.send({ from, to, subject: subject.slice(0, 150), html, text: lines.join('\n\n') });
    return true;
  } catch (e) {
    console.error('[mail]', e);
    return false;
  }
}
