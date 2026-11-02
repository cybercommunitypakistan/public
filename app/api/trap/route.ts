// =============================================================================
// FILE: app/api/trap/route.ts
// Honeypot endpoint for scanner traffic (see proxy.ts TRAPS). Logs the probe,
// blocks the IP for 7 days, and answers like a boring 404 so nothing leaks.
// =============================================================================
import { NextResponse, type NextRequest } from 'next/server';
import { db, hasDatabase } from '@/lib/db';
import { blockIp, logSecurityEvent } from '@/lib/security/guard';
import { requestInfo } from '@/lib/security/request';

async function handle(req: NextRequest) {
  if (hasDatabase) {
    try {
      await db.connect();
      const info = await requestInfo();
      const path = req.headers.get('x-trap-path') || req.nextUrl.pathname;
      await logSecurityEvent('trap_route', `${req.method} ${path}`, { ...info, path });
      await blockIp(info.ip, `trap route ${path}`, 24 * 7);
    } catch (e) {
      console.error('[trap]', e);
    }
  }
  // small random delay: slows scanners down, costs us nothing
  await new Promise((r) => setTimeout(r, 400 + Math.random() * 900));
  return new NextResponse('Not Found', { status: 404, headers: { 'content-type': 'text/plain', 'cache-control': 'no-store' } });
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const dynamic = 'force-dynamic';
