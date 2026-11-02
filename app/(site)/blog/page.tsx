// FILE: app/(site)/blog/page.tsx — blog index (pagination + tag filter)
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import SiteHeader from '@/components/layout/SiteHeader';
import PageHero from '@/components/cms/PageHero';
import { PostCard } from '@/components/cms/Cards';
import { getPosts, isSystemPageEnabled } from '@/lib/cms/queries';

export const metadata: Metadata = { title: 'Blog — Cyber Community Pakistan', description: 'Write-ups, guides and stories from the community.' };
export const revalidate = 300;

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ page?: string; tag?: string }> }) {
  if (!(await isSystemPageEnabled('blog'))) notFound();
  const sp = await searchParams;
  const page = Math.max(1, Math.min(500, Number.parseInt(sp.page ?? '1', 10) || 1));
  const tag = (sp.tag ?? '').slice(0, 40);
  const { posts, pages, tags } = await getPosts(page, tag);
  const q = (p: number, t = tag) => `/blog?${new URLSearchParams({ ...(p > 1 ? { page: String(p) } : {}), ...(t ? { tag: t } : {}) })}`;

  return (
    <>
      <SiteHeader />
      <main className="bg-ink text-paper">
        <PageHero eyebrow="Blog" title="Notes from the field" body="Write-ups, CTF walkthroughs, career guides and community news." />
        <section className="px-4 pb-28 sm:px-6 lg:px-10">
          {tags.length > 0 && (
            <nav aria-label="Tags" className="mb-10 flex flex-wrap gap-2">
              <Link href="/blog" className={`rounded-full border px-4 py-2 font-mono text-[11px] uppercase tracking-widest ${!tag ? 'border-emerald bg-emerald text-ink' : 'border-paper/15 text-paper/70 hover:border-paper/40'}`}>All</Link>
              {tags.map((t) => (
                <Link key={t} href={q(1, t)} className={`rounded-full border px-4 py-2 font-mono text-[11px] uppercase tracking-widest ${tag === t ? 'border-emerald bg-emerald text-ink' : 'border-paper/15 text-paper/70 hover:border-paper/40'}`}>{t}</Link>
              ))}
            </nav>
          )}
          {posts.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{posts.map((p) => <PostCard key={p.slug} post={p} />)}</div>
          ) : (
            <p className="rounded-3xl border border-paper/10 p-10 text-paper/60">No posts yet — check back soon.</p>
          )}
          {pages > 1 && (
            <nav aria-label="Pagination" className="mt-14 flex items-center justify-center gap-3 font-mono text-sm">
              {page > 1 && <Link href={q(page - 1)} className="rounded-full border border-paper/20 px-5 py-2.5 hover:border-emerald">← Newer</Link>}
              <span className="text-paper/50">Page {page} / {pages}</span>
              {page < pages && <Link href={q(page + 1)} className="rounded-full border border-paper/20 px-5 py-2.5 hover:border-emerald">Older →</Link>}
            </nav>
          )}
        </section>
      </main>
    </>
  );
}
