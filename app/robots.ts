// FILE: app/robots.ts — /admin is hidden; /internal-archive is a honeypot (see proxy.ts)
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api', '/internal-archive'] }],
    sitemap: `${base}/sitemap.xml`,
  };
}
