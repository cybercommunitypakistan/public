// FILE: app/admin/(panel)/blog/page.tsx
import Link from 'next/link';
import { requirePermission, can } from '@/lib/auth/guard';
import { db } from '@/lib/db';
import { Post } from '@/lib/models';
import ConfirmAction from '@/components/admin/ConfirmAction';
import { Badge, Card, EmptyState, LinkButton, PageHeader, Table, Td, fmtDate } from '@/components/admin/ui';
import { deletePost } from '../../_actions/posts';

export const metadata = { title: 'Blog' };

export default async function BlogAdmin({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const user = await requirePermission('blog.write');
  const { status } = await searchParams;
  const all = can(user, 'blog.manage');
  await db.connect();
  const filter: Record<string, unknown> = all ? {} : { author: user.id };
  if (status && ['draft', 'review', 'published'].includes(status)) filter.status = status;
  const posts = await Post.find(filter).sort({ updatedAt: -1 }).limit(200).populate('author', 'name').lean<{ _id: string; title: string; slug: string; status: string; publishedAt: Date | null; updatedAt: Date; featured: boolean; author: { _id: string; name: string } }[]>();
  const tabs = [['', 'All'], ['published', 'Published'], ['review', 'In review'], ['draft', 'Drafts']];
  return (
    <>
      <PageHeader eyebrow="Content" title="Blog" description={all ? 'All posts.' : 'Your posts. An editor publishes posts sent for review.'} actions={<LinkButton href="/admin/blog/new">+ New post</LinkButton>} />
      <div className="mb-4 flex gap-1">
        {tabs.map(([v, l]) => <Link key={v} href={v ? `/admin/blog?status=${v}` : '/admin/blog'} className={`rounded-lg px-3 py-1.5 text-[13px] ${(status ?? '') === v ? 'bg-white/10 text-paper' : 'text-paper/50 hover:text-paper'}`}>{l}</Link>)}
      </div>
      <Card padded={false}>
        {posts.length ? (
          <Table head={['Title', 'Author', 'Status', 'Publish date', '']}>
            {posts.map((p) => {
              const scheduled = p.status === 'published' && p.publishedAt && new Date(p.publishedAt).getTime() > Date.now();
              return (
                <tr key={String(p._id)} className="hover:bg-white/[0.02]">
                  <Td><Link href={`/admin/blog/${p._id}`} className="font-medium text-paper hover:text-emerald">{p.title}</Link>{p.featured && <span className="ml-2"><Badge tone="blue">featured</Badge></span>}</Td>
                  <Td className="text-paper/55">{p.author?.name}</Td>
                  <Td><Badge tone={scheduled ? 'blue' : p.status === 'published' ? 'green' : p.status === 'review' ? 'amber' : 'neutral'}>{scheduled ? 'scheduled' : p.status}</Badge></Td>
                  <Td className="text-paper/45">{fmtDate(p.publishedAt, true)}</Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-1.5">
                      {p.status === 'published' && <a href={`/blog/${p.slug}`} target="_blank" className="rounded-lg px-2.5 py-1.5 text-[12.5px] text-paper/50 hover:text-paper">View ↗</a>}
                      {(all || (String(p.author._id) === user.id && p.status !== 'published')) && <ConfirmAction confirm={`Delete “${p.title}”?`} action={deletePost.bind(null, String(p._id))}>Delete</ConfirmAction>}
                    </div>
                  </Td>
                </tr>
              );
            })}
          </Table>
        ) : <div className="p-5"><EmptyState title="No posts here" body="Share a write-up, a guide or community news." action={<LinkButton href="/admin/blog/new">Write a post</LinkButton>} /></div>}
      </Card>
    </>
  );
}
