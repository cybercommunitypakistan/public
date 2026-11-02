// FILE: components/cms/Cards.tsx — post + event cards used by lists and blocks
import Link from 'next/link';
import type { PostCard as Post, PublicEvent } from '@/lib/cms/queries';

const fmt = (iso: string, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', ...o }).format(new Date(`${iso.slice(0, 10)}T00:00:00Z`));

export function PostCard({ post }: { post: Post }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group flex flex-col overflow-hidden rounded-3xl border border-paper/10 bg-ink-2/60 transition hover:-translate-y-1 hover:border-emerald/60">
      <div className="relative aspect-[16/10] overflow-hidden bg-ink-2">
        {post.coverUrl
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={post.coverUrl} alt={post.coverAlt} loading="lazy" className="size-full object-cover transition duration-700 group-hover:scale-105" />
          : <div className="grid size-full place-items-center font-display text-6xl font-black uppercase text-paper/10">{post.title.slice(0, 2)}</div>}
        {post.featured && <span className="absolute left-4 top-4 rounded-full bg-emerald px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-ink">Featured</span>}
      </div>
      <div className="flex flex-1 flex-col p-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-emerald">{fmt(post.publishedAt, { day: '2-digit', month: 'short', year: 'numeric' })} · {post.readingMinutes} min</p>
        <h3 className="mt-3 font-display text-2xl font-black uppercase leading-[0.95] tracking-tight text-paper">{post.title}</h3>
        <p className="mt-3 line-clamp-3 text-[15px] leading-relaxed text-paper/65">{post.excerpt}</p>
        <div className="mt-auto flex flex-wrap gap-2 pt-5">
          {post.tags.slice(0, 3).map((t) => <span key={t} className="rounded-full border border-paper/15 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-paper/60">{t}</span>)}
        </div>
      </div>
    </Link>
  );
}

export function EventRow({ event, past = false }: { event: PublicEvent; past?: boolean }) {
  return (
    <Link href={`/events/${event.slug}`} className={`group grid grid-cols-[84px_1fr_auto] items-center gap-5 border-t border-paper/10 py-6 transition hover:bg-paper/[0.03] sm:grid-cols-[120px_1fr_auto] sm:gap-8 ${past ? 'opacity-55' : ''}`}>
      <div className="text-center">
        <p className="font-display text-5xl font-black leading-none tracking-tight text-paper sm:text-6xl">{fmt(event.date, { day: '2-digit' })}</p>
        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.2em] text-emerald">{fmt(event.date, { month: 'short', year: 'numeric' })}</p>
      </div>
      <div className="min-w-0">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-paper/50">{event.type.toLowerCase()}{event.series ? ` · ${event.series}` : ''}{event.startTime ? ` · ${event.startTime} PKT` : ''}</p>
        <h3 className="mt-1.5 truncate font-display text-2xl font-black uppercase tracking-tight text-paper sm:text-3xl">{event.title}</h3>
        <p className="mt-1 truncate text-[14.5px] text-paper/60">{event.location || event.format}</p>
      </div>
      <span className="grid size-12 place-items-center rounded-full border border-paper/20 text-paper transition group-hover:border-emerald group-hover:bg-emerald group-hover:text-ink">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17 17 7M8 7h9v9" /></svg>
      </span>
    </Link>
  );
}
