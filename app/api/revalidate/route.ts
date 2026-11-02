// =============================================================================
// FILE: app/api/revalidate/route.ts
// Refresh cached content after editing the database outside the admin panel
// (MongoDB Atlas UI, scripts, or database webhooks).
//
//   POST /api/revalidate            header  x-revalidate-secret: <REVALIDATE_SECRET>
//   body (optional): { "tags": ["programs", "events"] }   → default: everything
// =============================================================================

import { revalidateTag } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';
import { TAGS, type ContentTag } from '@/lib/content/tags';

const ALL = Object.values(TAGS) as ContentTag[];

export async function POST(req: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || req.headers.get('x-revalidate-secret') !== secret) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  let tags: ContentTag[] = ALL;
  try {
    const body = (await req.json()) as { tags?: string[] };
    if (Array.isArray(body?.tags) && body.tags.length) {
      tags = body.tags.filter((t): t is ContentTag => (ALL as string[]).includes(t));
    }
  } catch {
    /* no body → refresh everything */
  }

  for (const t of tags) revalidateTag(t, { expire: 0 });
  return NextResponse.json({ ok: true, revalidated: tags });
}
