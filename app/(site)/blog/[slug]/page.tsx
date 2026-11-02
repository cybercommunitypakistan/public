// FILE: app/(site)/blog/[slug]/page.tsx — one blog post
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import SiteHeader from '@/components/layout/SiteHeader';
import Markdown from '@/components/cms/Markdown';
import { getPost, isSystemPageEnabled } from '@/lib/cms/queries';

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const post = await getPost((await params).slug);
  if (!post) return { title: 'Not found' };
  return {
    title: post.seoTitle || `${post.title} — CCP Blog`,
    description: post.seoDescription || post.excerpt,
    openGraph: { type: 'article', title: post.title, description: post.excerpt, publishedTime: post.publishedAt, images: post.coverUrl ? [post.coverUrl] : [] },
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  if (!(await isSystemPageEnabled('blog'))) notFound();
  const post = await getPost((await params).slug);
  if (!post) notFound();
  const date = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(post.publishedAt));

  return (
    <>
      <SiteHeader />
      <main className="bg-ink text-paper">
        <article>
          <header className="px-4 pb-12 pt-36 sm:px-6 sm:pt-44 lg:px-10">
            <div className="mx-auto max-w-4xl">
              <Link href="/blog" className="font-mono text-[11px] uppercase tracking-[0.22em] text-emerald hover:underline">← Blog</Link>
              <h1 className="mt-6 font-display text-[clamp(40px,6.4vw,100px)] font-black uppercase leading-[0.88] tracking-[-0.05em] text-balance">{post.title}</h1>
              {post.excerpt && <p className="mt-6 text-xl leading-relaxed text-paper/70">{post.excerpt}</p>}
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-paper/10 pt-5 font-mono text-[12px] uppercase tracking-[0.16em] text-paper/55">
                <span>{post.author}</span><span>{date}</span><span>{post.readingMinutes} min read</span>
                {post.tags.map((t) => <Link key={t} href={`/blog?tag=${encodeURIComponent(t)}`} className="text-emerald hover:underline">#{t}</Link>)}
              </div>
            </div>
          </header>
          {post.coverUrl && (
            <div className="px-4 sm:px-6 lg:px-10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.coverUrl} alt={post.coverAlt} className="mx-auto aspect-[21/9] w-full max-w-6xl rounded-[32px] object-cover" />
            </div>
          )}
          <div className="px-4 pb-28 pt-14 sm:px-6 lg:px-10">
            <Markdown className="mx-auto max-w-3xl">{post.content}</Markdown>
          </div>
        </article>
      </main>
    </>
  );
}
