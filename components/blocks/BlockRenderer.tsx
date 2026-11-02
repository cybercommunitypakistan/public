// =============================================================================
// FILE: components/blocks/BlockRenderer.tsx
// Renders page-builder blocks (lib/blocks/registry.ts). Every block re-parses
// its data with the registry schema, so bad data falls back to defaults
// instead of crashing the page. All links go through safeHref.
// =============================================================================
import Link from 'next/link';
import { BLOCKS, isBlockType, type BlockData } from '@/lib/blocks/registry';
import { safeHref } from '@/lib/cms/slug';
import { getEvents, getPosts } from '@/lib/cms/queries';
import Markdown from '@/components/cms/Markdown';
import FormBlock from '@/components/cms/FormBlock';
import { EventRow, PostCard } from '@/components/cms/Cards';

const wrap = 'px-4 sm:px-6 lg:px-10';
const eyebrow = 'font-mono text-[11px] uppercase tracking-[0.22em] text-emerald';
const h2 = 'font-display text-[clamp(36px,4.6vw,76px)] font-black uppercase leading-[0.9] tracking-[-0.045em] text-balance';

function Btn({ href, children, ghost = false }: { href: string; children: React.ReactNode; ghost?: boolean }) {
  const h = safeHref(href);
  const cls = ghost
    ? 'inline-flex items-center gap-2 rounded-full border border-paper/25 px-6 py-3.5 font-display text-sm font-black uppercase tracking-wide text-paper transition hover:border-emerald hover:text-emerald'
    : 'inline-flex items-center gap-2 rounded-full bg-emerald px-6 py-3.5 font-display text-sm font-black uppercase tracking-wide text-ink transition hover:bg-emerald-soft';
  return /^https?:/i.test(h) ? <a href={h} target="_blank" rel="noopener noreferrer" className={cls}>{children}</a> : <Link href={h} className={cls}>{children}</Link>;
}

async function Block({ type, data }: { type: string; data: unknown }) {
  if (!isBlockType(type)) return null;
  const parsed = BLOCKS[type].schema.safeParse(data);
  const d = (parsed.success ? parsed.data : BLOCKS[type].defaults) as never;

  switch (type) {
    case 'hero': {
      const b = d as BlockData<'hero'>;
      return (
        <section className={`relative overflow-hidden bg-ink pb-20 pt-36 text-paper sm:pb-28 sm:pt-44 ${wrap}`}>
          <div aria-hidden className="pointer-events-none absolute -left-40 top-10 size-[560px] rounded-full bg-emerald/15 blur-[130px]" />
          <div className="relative grid items-end gap-12 lg:grid-cols-12">
            <div className={b.image ? 'lg:col-span-7' : 'lg:col-span-11'}>
              {b.eyebrow && <p className={eyebrow}>{b.eyebrow}</p>}
              <h1 className="mt-4 font-display text-[clamp(48px,8vw,140px)] font-black uppercase leading-[0.84] tracking-[-0.055em] text-balance">{b.title}</h1>
              {b.body && <p className="mt-7 max-w-2xl text-lg leading-relaxed text-paper/70">{b.body}</p>}
              <div className="mt-9 flex flex-wrap gap-3">
                {b.primaryLabel && <Btn href={b.primaryHref}>{b.primaryLabel} →</Btn>}
                {b.secondaryLabel && <Btn href={b.secondaryHref} ghost>{b.secondaryLabel}</Btn>}
              </div>
            </div>
            {b.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={safeHref(b.image)} alt="" className="aspect-[4/5] w-full rounded-[28px] object-cover lg:col-span-5" />
            )}
          </div>
        </section>
      );
    }
    case 'richText':
      return <section className={`bg-ink py-12 text-paper ${wrap}`}><Markdown className="mx-auto max-w-3xl">{(d as BlockData<'richText'>).markdown}</Markdown></section>;
    case 'image': {
      const b = d as BlockData<'image'>;
      if (!b.src) return null;
      return (
        <figure className={`bg-ink py-10 ${wrap}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={safeHref(b.src)} alt={b.alt} loading="lazy" className={`mx-auto w-full rounded-[28px] object-cover ${b.wide ? '' : 'max-w-4xl'}`} />
          {b.caption && <figcaption className="mx-auto mt-3 max-w-4xl font-mono text-[12px] text-paper/50">{b.caption}</figcaption>}
        </figure>
      );
    }
    case 'cards': {
      const b = d as BlockData<'cards'>;
      return (
        <section className={`bg-ink py-20 text-paper ${wrap}`}>
          {b.eyebrow && <p className={eyebrow}>{b.eyebrow}</p>}
          {b.title && <h2 className={`mt-4 ${h2}`}>{b.title}</h2>}
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {b.items.map((it, i) => {
              const inner = (
                <>
                  {it.tag && <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-emerald">{it.tag}</span>}
                  <h3 className="mt-6 font-display text-2xl font-black uppercase leading-[0.95] tracking-tight">{it.title}</h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-paper/65">{it.body}</p>
                </>
              );
              const cls = 'block h-full rounded-3xl border border-paper/10 bg-ink-2/60 p-7 transition hover:-translate-y-1 hover:border-emerald/60';
              return it.href ? <Link key={i} href={safeHref(it.href)} className={cls}>{inner}</Link> : <div key={i} className={cls}>{inner}</div>;
            })}
          </div>
        </section>
      );
    }
    case 'stats': {
      const b = d as BlockData<'stats'>;
      return (
        <section className={`bg-ink py-16 text-paper ${wrap}`}>
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-paper/10 bg-paper/10 md:grid-cols-4">
            {b.items.map((s, i) => (
              <div key={i} className="bg-ink p-8">
                <dt className="font-mono text-[11px] uppercase tracking-[0.2em] text-paper/50">{s.label}</dt>
                <dd className="mt-3 font-display text-5xl font-black tracking-tight text-emerald">{s.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      );
    }
    case 'cta': {
      const b = d as BlockData<'cta'>;
      return (
        <section className={`bg-ink py-16 ${wrap}`}>
          <div className="relative overflow-hidden rounded-[32px] bg-emerald p-10 text-ink sm:p-16">
            <div aria-hidden className="absolute -right-20 -top-20 size-80 rounded-full bg-paper/25 blur-3xl" />
            <h2 className="relative max-w-3xl font-display text-[clamp(36px,5vw,84px)] font-black uppercase leading-[0.88] tracking-[-0.05em]">{b.title}</h2>
            {b.body && <p className="relative mt-5 max-w-xl text-lg text-ink/75">{b.body}</p>}
            {b.label && (
              <Link href={safeHref(b.href)} className="relative mt-8 inline-flex items-center gap-2 rounded-full bg-ink px-7 py-4 font-display text-sm font-black uppercase tracking-wide text-paper transition hover:bg-ink-2">
                {b.label} →
              </Link>
            )}
          </div>
        </section>
      );
    }
    case 'faq': {
      const b = d as BlockData<'faq'>;
      return (
        <section className={`bg-ink py-20 text-paper ${wrap}`}>
          <div className="mx-auto max-w-4xl">
            {b.title && <h2 className={h2}>{b.title}</h2>}
            <div className="mt-10 divide-y divide-paper/10 border-y border-paper/10">
              {b.items.map((it, i) => (
                <details key={i} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-lg font-semibold">
                    {it.q}
                    <span className="grid size-9 shrink-0 place-items-center rounded-full border border-paper/20 transition group-open:rotate-45 group-open:border-emerald group-open:text-emerald">+</span>
                  </summary>
                  <p className="mt-3 max-w-3xl leading-relaxed text-paper/65">{it.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      );
    }
    case 'events': {
      const b = d as BlockData<'events'>;
      const today = new Date().toISOString().slice(0, 10);
      const list = (await getEvents()).filter((e) => e.date >= today).slice(0, b.limit);
      return (
        <section className={`bg-ink py-20 text-paper ${wrap}`}>
          <div className="flex items-end justify-between gap-6">
            {b.title && <h2 className={h2}>{b.title}</h2>}
            <Link href="/events" className="shrink-0 font-mono text-[12px] uppercase tracking-[0.2em] text-emerald hover:underline">All events →</Link>
          </div>
          <div className="mt-10 border-b border-paper/10">
            {list.length ? list.map((e) => <EventRow key={e.id} event={e} />) : <p className="border-t border-paper/10 py-8 text-paper/55">New sessions are announced soon.</p>}
          </div>
        </section>
      );
    }
    case 'posts': {
      const b = d as BlockData<'posts'>;
      const { posts } = await getPosts(1, b.tag);
      return (
        <section className={`bg-ink py-20 text-paper ${wrap}`}>
          <div className="flex items-end justify-between gap-6">
            {b.title && <h2 className={h2}>{b.title}</h2>}
            <Link href="/blog" className="shrink-0 font-mono text-[12px] uppercase tracking-[0.2em] text-emerald hover:underline">Read the blog →</Link>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{posts.slice(0, b.limit).map((p) => <PostCard key={p.slug} post={p} />)}</div>
        </section>
      );
    }
    case 'form': {
      const b = d as BlockData<'form'>;
      if (!b.formSlug) return null;
      return (
        <section className={`bg-ink py-20 text-paper ${wrap}`}>
          <div className="mx-auto max-w-3xl rounded-[32px] border border-paper/10 bg-ink-2/50 p-6 sm:p-10">
            {b.title && <h2 className="mb-8 font-display text-4xl font-black uppercase tracking-tight">{b.title}</h2>}
            <FormBlock slug={b.formSlug} />
          </div>
        </section>
      );
    }
    case 'video': {
      const b = d as BlockData<'video'>;
      if (!b.youtubeId) return null;
      return (
        <section className={`bg-ink py-12 ${wrap}`}>
          <div className="mx-auto aspect-video max-w-5xl overflow-hidden rounded-[28px] border border-paper/10">
            <iframe className="size-full" src={`https://www.youtube-nocookie.com/embed/${b.youtubeId}`} title={b.title || 'Video'} loading="lazy"
              allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" sandbox="allow-scripts allow-same-origin allow-presentation" />
          </div>
        </section>
      );
    }
  }
}

export default function BlockRenderer({ blocks }: { blocks: { id: string; type: string; data: unknown }[] }) {
  return <>{blocks.map((b) => <Block key={b.id} type={b.type} data={b.data} />)}</>;
}
