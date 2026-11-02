// FILE: app/(site)/forms/[slug]/page.tsx — a standalone form
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import SiteHeader from '@/components/layout/SiteHeader';
import Markdown from '@/components/cms/Markdown';
import FormBlock from '@/components/cms/FormBlock';
import { getPublicForm } from '@/lib/cms/queries';

export const dynamic = 'force-dynamic'; // live open/closed state + fresh timing token

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const f = await getPublicForm((await params).slug);
  return { title: f ? `${f.title} — CCP` : 'Not found', robots: { index: false } };
}

export default async function FormPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const form = await getPublicForm(slug);
  if (!form) notFound();
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-ink px-4 pb-28 pt-36 text-paper sm:px-6 sm:pt-44 lg:px-10">
        <div className="mx-auto max-w-3xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-emerald">Form</p>
          <h1 className="mt-4 font-display text-[clamp(40px,6vw,92px)] font-black uppercase leading-[0.88] tracking-[-0.05em]">{form.title}</h1>
          {form.description && <Markdown className="mt-6">{form.description}</Markdown>}
          <div className="mt-12 rounded-[32px] border border-paper/10 bg-ink-2/50 p-6 sm:p-10"><FormBlock slug={slug} /></div>
        </div>
      </main>
    </>
  );
}
