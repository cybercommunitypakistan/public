// FILE: next.config.ts
import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV !== 'production';
// HTTPS-only headers are skipped when you run a production build on plain http (e.g. http://localhost)
const httpsSite = !isDev && !(process.env.NEXT_PUBLIC_SITE_URL ?? '').startsWith('http://');

// Content Security Policy. 'unsafe-inline' for scripts is needed by Next's
// inline bootstrap without per-request nonces (which would make every page
// dynamic). Everything else is locked down: no plugins, no framing, forms and
// base URI to self, images only from self + Cloudinary.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://res.cloudinary.com",
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? ' ws: wss:' : ''}`,
  "media-src 'self' https://res.cloudinary.com",
  "frame-src 'self' https://www.youtube-nocookie.com https://player.vimeo.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(httpsSite ? ['upgrade-insecure-requests'] : []),
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-site' },
  ...(httpsSite ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }] : []),
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // uploads from the admin panel (logo, covers, team photos) are served by Cloudinary
    remotePatterns: [{ protocol: 'https', hostname: 'res.cloudinary.com' }],
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    optimizePackageImports: ['@gsap/react', 'gsap', 'lenis'],
    serverActions: { bodySizeLimit: '6mb' },
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
