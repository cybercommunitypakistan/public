'use server';
// FILE: app/admin/_actions/posts.ts — blog posts with author / publisher rules
import { z } from 'zod';
import { db } from '@/lib/db';
import { Post } from '@/lib/models';
import { authorize, can } from '@/lib/auth/guard';
import { audit } from '@/lib/audit';
import { refreshContent } from '@/lib/content/revalidate';
import { slugify } from '@/lib/cms/slug';
import { bool, fail, isId, ok, str, zodFail } from '@/lib/admin/result';
import { pktDate } from '@/lib/admin/result';
import type { ActionState } from '@/components/admin/ActionForm';

const schema = z.object({
  title: z.string().trim().min(3).max(160),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Lowercase words separated by dashes').max(160),
  excerpt: z.string().trim().max(400),
  content: z.string().max(200_000),
  coverUrl: z.string().trim().max(500),
  coverAlt: z.string().trim().max(200),
  tags: z.array(z.string().trim().toLowerCase().min(1).max(30)).max(10),
  status: z.enum(['draft', 'review', 'published']),
  publishedAt: z.string().trim(),
  featured: z.boolean(),
  seoTitle: z.string().trim().max(160),
  seoDescription: z.string().trim().max(300),
});

export async function savePost(_p: ActionState, fd: FormData): Promise<ActionState> {
  const auth = await authorize('blog.write'); if (!auth.ok) return fail(auth.error);
  const u = auth.user;
  const id = str(fd, 'id', 24);
  const parsed = schema.safeParse({
    title: str(fd, 'title', 200), slug: slugify(str(fd, 'slug') || str(fd, 'title'), 160).replace(/\//g, '-'), excerpt: str(fd, 'excerpt', 500),
    content: String(fd.get('content') ?? ''), coverUrl: str(fd, 'coverUrl'), coverAlt: str(fd, 'coverAlt'),
    tags: str(fd, 'tags', 400).split(',').map((t) => t.trim()).filter(Boolean), status: str(fd, 'status') || 'draft',
    publishedAt: str(fd, 'publishedAt', 30), featured: bool(fd, 'featured'), seoTitle: str(fd, 'seoTitle'), seoDescription: str(fd, 'seoDescription'),
  });
  if (!parsed.success) return zodFail(parsed.error);
  const d = parsed.data;
  if (d.coverUrl && !/^https:\/\//.test(d.coverUrl) && !d.coverUrl.startsWith('/')) return fail('Cover image must be an https:// URL.');

  await db.connect();
  const existing = isId(id) ? await Post.findById(id).lean() : null;
  if (isId(id) && !existing) return fail('Post not found.');
  if (existing && String(existing.author) !== u.id && !can(u, 'blog.manage')) return fail('You can only edit your own posts.');
  const canPublish = can(u, 'blog.publish');
  if (d.status === 'published' && !canPublish) return fail('You can save drafts or send for review; an editor publishes.');
  if (existing?.status === 'published' && !canPublish) return fail('This post is live — only an editor can change it.');
  if (await Post.exists({ slug: d.slug, _id: { $ne: existing?._id } })) return fail('Another post uses this URL slug.', { slug: 'Taken' });

  const when = pktDate(d.publishedAt);
  if (when && Number.isNaN(when.getTime())) return fail('Invalid publish date.');
  const words = d.content.trim() ? d.content.trim().split(/\s+/).length : 0;
  const doc = {
    ...d, coverUrl: d.coverUrl || null, featured: canPublish ? d.featured : (existing?.featured ?? false),
    publishedAt: d.status === 'published' ? (when ?? existing?.publishedAt ?? new Date()) : when,
    readingMinutes: Math.max(1, Math.round(words / 220)),
  };
  if (existing) {
    await Post.updateOne({ _id: existing._id }, { $set: doc });
    await audit(u, d.status === 'published' && existing.status !== 'published' ? 'post.publish' : 'post.update', `post:${d.slug}`);
  } else {
    const created = await Post.create({ ...doc, author: u.id });
    await audit(u, 'post.create', `post:${d.slug}`);
    refreshContent('posts');
    return ok('Post created.', `/admin/blog/${created._id}`);
  }
  refreshContent('posts');
  const scheduled = d.status === 'published' && doc.publishedAt && doc.publishedAt.getTime() > Date.now();
  return ok(d.status === 'published' ? (scheduled ? 'Scheduled — it goes live at the publish time.' : 'Published.') : d.status === 'review' ? 'Sent for review.' : 'Draft saved.');
}

export async function deletePost(id: string) {
  const auth = await authorize('blog.write'); if (!auth.ok) return fail(auth.error);
  if (!isId(id)) return fail('Invalid request.');
  await db.connect();
  const p = await Post.findById(id).lean();
  if (!p) return fail('Post not found.');
  const own = String(p.author) === auth.user.id;
  if (!(can(auth.user, 'blog.manage') || (own && p.status !== 'published'))) return fail('You can’t delete this post.');
  await Post.deleteOne({ _id: id });
  await audit(auth.user, 'post.delete', `post:${p.slug}`);
  refreshContent('posts');
  return ok('Post deleted.');
}
