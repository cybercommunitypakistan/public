// =============================================================================
// FILE: proxy.ts  (Next 16 — formerly middleware.ts)
//  1. Trap routes: scanners probing /wp-admin, /.env, /phpmyadmin… are
//     rewritten to /api/trap, which logs them and blocks the IP.
//  2. /admin/*: no session cookie → straight to the login page.
//     (The real session check runs on the server in every admin page/action.)
//  3. Passes the pathname to server code as x-pathname (for security logs).
// =============================================================================
import { NextResponse, type NextRequest } from 'next/server';

const TRAPS = [
  /^\/wp-(admin|login|content|includes)/i, /^\/wordpress/i, /^\/xmlrpc\.php/i, /\.php$/i,
  /^\/\.env/i, /^\/\.git/i, /^\/\.aws/i, /^\/\.ssh/i, /^\/\.ds_store/i,
  /^\/phpmyadmin/i, /^\/pma/i, /^\/adminer/i, /^\/administrator/i, /^\/cgi-bin/i,
  /^\/(backup|db|dump|database)\.(zip|sql|tar|gz)$/i, /^\/server-status/i, /^\/actuator/i,
  /^\/internal-archive/i, // listed as Disallow in robots.txt — only bad bots go there
];

const SESSION_COOKIES = ['__Host-ccp_session', 'ccp_session'];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (TRAPS.some((r) => r.test(pathname))) {
    const url = req.nextUrl.clone();
    url.pathname = '/api/trap';
    url.search = '';
    const headers = new Headers(req.headers);
    headers.set('x-trap-path', pathname.slice(0, 200));
    return NextResponse.rewrite(url, { request: { headers } });
  }

  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const hasCookie = SESSION_COOKIES.some((c) => req.cookies.get(c)?.value);
    if (!hasCookie) {
      const url = req.nextUrl.clone();
      url.pathname = '/admin/login';
      url.search = '';
      return NextResponse.redirect(url);
    }
  }

  const headers = new Headers(req.headers);
  headers.set('x-pathname', pathname);
  const res = NextResponse.next({ request: { headers } });
  if (pathname.startsWith('/admin')) {
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
    res.headers.set('Cache-Control', 'no-store');
  }
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|avif|svg|ico|woff2?)$).*)'],
};
