// =============================================================================
// FILE: app/api/admin/upload/route.ts
// Image upload → Cloudinary. Requires the `media.upload` permission.
// Checks: same-origin request, rate limit, size ≤ 5 MB, real image bytes
// (magic numbers — the browser's MIME type is not trusted), no SVG (can carry
// scripts). Returns { url, width, height, publicId }.
// =============================================================================
import { NextResponse, type NextRequest } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { authorize } from '@/lib/auth/guard';
import { rateLimit } from '@/lib/security/rateLimit';
import { audit } from '@/lib/audit';

export const runtime = 'nodejs';
const MAX = 5 * 1024 * 1024;

function sniff(b: Buffer): string | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpg';
  if (b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (b.subarray(0, 4).toString('ascii') === 'RIFF' && b.subarray(8, 12).toString('ascii') === 'WEBP') return 'webp';
  if (b.subarray(0, 6).toString('ascii').startsWith('GIF8')) return 'gif';
  if (b.subarray(4, 12).toString('ascii').match(/^ftyp(avif|avis)/)) return 'avif';
  return null;
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin');
  if (origin && new URL(origin).host !== req.headers.get('host')) return NextResponse.json({ error: 'Bad origin' }, { status: 403 });

  const auth = await authorize('media.upload');
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });
  const rl = await rateLimit(`upload:${auth.user.id}`, 30, 3600);
  if (!rl.ok) return NextResponse.json({ error: 'Upload limit reached — try again later.' }, { status: 429 });

  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return NextResponse.json({ error: 'Cloudinary is not configured (CLOUDINARY_* in .env). You can paste an image URL instead.' }, { status: 501 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'No file' }, { status: 400 });
  if (file.size > MAX) return NextResponse.json({ error: 'Max 5 MB' }, { status: 413 });
  const buf = Buffer.from(await file.arrayBuffer());
  const kind = sniff(buf);
  if (!kind) return NextResponse.json({ error: 'Only JPG, PNG, WebP, GIF or AVIF images' }, { status: 415 });

  cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET, secure: true });
  try {
    const res = await new Promise<{ secure_url: string; width: number; height: number; public_id: string }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: process.env.CLOUDINARY_FOLDER || 'ccp', resource_type: 'image', overwrite: false, unique_filename: true }, (err, r) => (err || !r ? reject(err) : resolve(r as never)))
        .end(buf);
    });
    await audit(auth.user, 'media.upload', res.public_id, { bytes: file.size, kind });
    return NextResponse.json({ url: res.secure_url, width: res.width, height: res.height, publicId: res.public_id });
  } catch (e) {
    console.error('[upload]', e);
    return NextResponse.json({ error: 'Upload failed' }, { status: 502 });
  }
}
