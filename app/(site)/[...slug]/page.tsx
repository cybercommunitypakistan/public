// FILE: app/(site)/[...slug]/page.tsx — every page created in the admin panel
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import SiteHeader from '@/components/layout/SiteHeader';
import BlockRenderer from '@/components/blocks/BlockRenderer';
import { getPublishedPage } from '@/lib/cms/queries';
import { isReservedSlug, PAGE_SLUG } from '@/lib/cms/slug';

export const revalidate = 300;

async function load(parts: string[]) {
  const slug = parts.map((p) => decodeURIComponent(p)).join('/').toLowerCase();
  if (!PAGE_SLUG.test(slug) || isReservedSlug(slug)) return null;
  return getPublishedPage(slug);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
  const page = await load((await params).slug);
  if (!page) return { title: 'Not found' };
  return { title: `${page.title} — Cyber Community Pakistan`, description: page.description, openGraph: { images: page.ogImage ? [page.ogImage] : [] } };
}

export default async function CmsPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const page = await load((await params).slug);
  if (!page) notFound();
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-ink pb-16">
        {page.blocks[0]?.type !== 'hero' && <div className="h-28" />}
        <BlockRenderer blocks={page.blocks} />
      </main>
    </>
  );
}
