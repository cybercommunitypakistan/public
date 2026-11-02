// FILE: app/admin/(panel)/blog/[id]/page.tsx — post editor
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requirePermission, can } from '@/lib/auth/guard';
import { db } from '@/lib/db';
import { Post } from '@/lib/models';
import { isId } from '@/lib/admin/result';
import ActionForm, { FieldError, SubmitButton } from '@/components/admin/ActionForm';
import MarkdownEditor from '@/components/admin/MarkdownEditor';
import ImageField from '@/components/admin/ImageField';
import { Card, Field, PageHeader, inputCls } from '@/components/admin/ui';
import { savePost } from '../../../_actions/posts';

const local = (d?: Date | null) => (d ? new Date(new Date(d).getTime() + 5 * 3600_000).toISOString().slice(0, 16) : '');

export default async function EditPost({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission('blog.write');
  const { id } = await params;
  await db.connect();
  const post = id === 'new' ? null : isId(id) ? await Post.findById(id).lean() : null;
  if (id !== 'new' && !post) notFound();
  if (post && String(post.author) !== user.id && !can(user, 'blog.manage')) notFound();
  const publisher = can(user, 'blog.publish');

  return (
    <>
      <PageHeader eyebrow={<Link href="/admin/blog" className="hover:underline">← Blog</Link>} title={post ? 'Edit post' : 'New post'}
        actions={post?.status === 'published' ? <a href={`/blog/${post.slug}`} target="_blank" className="rounded-xl border border-white/12 px-4 py-2.5 text-[13.5px] hover:border-white/25">View live ↗</a> : null} />
      <ActionForm action={savePost} className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <input type="hidden" name="id" value={post ? String(post._id) : ''} />
        <div className="space-y-6">
          <Card>
            <input name="title" defaultValue={post?.title ?? ''} required placeholder="Post title" aria-label="Title"
              className="w-full bg-transparent font-display text-[34px] font-black uppercase leading-none tracking-tight text-paper outline-none placeholder:text-paper/20" />
            <FieldError name="title" />
            <textarea name="excerpt" defaultValue={post?.excerpt ?? ''} rows={2} maxLength={400} placeholder="Short summary shown on cards and in Google…" aria-label="Excerpt"
              className="mt-4 w-full resize-none bg-transparent text-[15px] text-paper/70 outline-none placeholder:text-paper/25" />
          </Card>
          <MarkdownEditor name="content" defaultValue={post?.content ?? ''} />
        </div>
        <div className="space-y-6 xl:sticky xl:top-8 xl:self-start">
          <Card title="Publish">
            <div className="grid gap-4">
              <Field label="Status">
                <select name="status" defaultValue={post?.status ?? 'draft'} className={inputCls}>
                  <option value="draft">Draft</option>
                  <option value="review">Ready for review</option>
                  {publisher && <option value="published">Published</option>}
                </select>
              </Field>
              <Field label="Publish date (PKT)" hint="A future date schedules the post"><input type="datetime-local" name="publishedAt" defaultValue={local(post?.publishedAt)} className={inputCls} /></Field>
              {publisher && <label className="flex items-center gap-3 text-[13.5px] text-paper/75"><input type="checkbox" name="featured" defaultChecked={post?.featured} className="size-4 accent-[var(--color-emerald)]" />Feature at the top</label>}
              <SubmitButton className="w-full">{post ? 'Save' : 'Create post'}</SubmitButton>
            </div>
          </Card>
          <Card title="Details">
            <div className="grid gap-4">
              <Field label="URL slug" hint="Auto from the title if empty"><input name="slug" defaultValue={post?.slug ?? ''} className={`${inputCls} font-mono text-[13px]`} /></Field>
              <Field label="Tags" hint="Comma separated"><input name="tags" defaultValue={post?.tags.join(', ') ?? ''} placeholder="ctf, web, career" className={inputCls} /></Field>
              <Field label="Cover image"><ImageField name="coverUrl" defaultValue={post?.coverUrl ?? ''} /></Field>
              <Field label="Cover alt text"><input name="coverAlt" defaultValue={post?.coverAlt ?? ''} className={inputCls} /></Field>
            </div>
          </Card>
          <Card title="SEO">
            <div className="grid gap-4">
              <Field label="SEO title"><input name="seoTitle" defaultValue={post?.seoTitle ?? ''} maxLength={160} className={inputCls} /></Field>
              <Field label="SEO description"><textarea name="seoDescription" defaultValue={post?.seoDescription ?? ''} maxLength={300} rows={3} className={inputCls} /></Field>
            </div>
          </Card>
        </div>
      </ActionForm>
    </>
  );
}
