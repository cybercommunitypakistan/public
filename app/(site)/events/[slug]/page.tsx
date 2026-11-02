// FILE: app/(site)/events/[slug]/page.tsx — event detail + registration form
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import SiteHeader from '@/components/layout/SiteHeader';
import Markdown from '@/components/cms/Markdown';
import FormBlock from '@/components/cms/FormBlock';
import { getEvent, getEventSeats, isSystemPageEnabled } from '@/lib/cms/queries';
import { safeHref } from '@/lib/cms/slug';

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const e = await getEvent((await params).slug);
  return e ? { title: `${e.title} — CCP Events`, description: e.description, openGraph: { images: e.coverUrl ? [e.coverUrl] : [] } } : { title: 'Not found' };
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  if (!(await isSystemPageEnabled('events'))) notFound();
  const e = await getEvent((await params).slug);
  if (!e) notFound();
  const seats = e.capacity > 0 ? await getEventSeats(e.id) : 0;
  const left = e.capacity > 0 ? Math.max(0, e.capacity - seats) : null;
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi' }).format(new Date());
  const isPast = (e.endDate ?? e.date) < today;
  const closed = isPast || (e.closesAt && new Date(e.closesAt).getTime() < Date.now());
  const day = (iso: string) => new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${iso}T00:00:00Z`));

  const facts = [
    ['When', `${day(e.date)}${e.endDate && e.endDate !== e.date ? ` – ${day(e.endDate)}` : ''}`],
    ...(e.startTime ? [['Time', `${e.startTime}${e.endTime ? ` – ${e.endTime}` : ''} PKT`]] : []),
    ['Where', e.location || e.format],
    ['Type', `${e.type.charAt(0)}${e.type.slice(1).toLowerCase()}${e.series ? ` · ${e.series}` : ''}`],
    ...(left !== null ? [['Seats', left > 0 ? `${left} of ${e.capacity} left` : e.waitlist ? 'Full — waitlist open' : 'Full']] : []),
  ];

  return (
    <>
      <SiteHeader />
      <main className="bg-ink text-paper">
        <header className="relative overflow-hidden px-4 pb-14 pt-36 sm:px-6 sm:pt-44 lg:px-10">
          {e.coverUrl && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={e.coverUrl} alt="" className="absolute inset-0 size-full object-cover opacity-25" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/80 to-ink/40" />
            </>
          )}
          <div className="relative max-w-5xl">
            <Link href="/events" className="font-mono text-[11px] uppercase tracking-[0.22em] text-emerald hover:underline">← All events</Link>
            <h1 className="mt-6 font-display text-[clamp(44px,7vw,120px)] font-black uppercase leading-[0.86] tracking-[-0.05em] text-balance">{e.title}</h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-paper/70">{e.description}</p>
          </div>
        </header>
        <div className="grid gap-12 px-4 pb-28 sm:px-6 lg:grid-cols-12 lg:px-10">
          <div className="lg:col-span-7">
            <dl className="grid gap-px overflow-hidden rounded-3xl border border-paper/10 bg-paper/10 sm:grid-cols-2">
              {facts.map(([k, v]) => (
                <div key={k} className="bg-ink-2/80 p-5">
                  <dt className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-emerald">{k}</dt>
                  <dd className="mt-1.5 text-[15.5px] text-paper">{v}</dd>
                </div>
              ))}
            </dl>
            {e.body && <Markdown className="mt-12">{e.body}</Markdown>}
          </div>
          <aside id="register" className="lg:col-span-5">
            <div className="rounded-[32px] border border-paper/10 bg-ink-2/60 p-6 sm:p-8 lg:sticky lg:top-28">
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-emerald">Registration</p>
              <h2 className="mb-7 mt-2 font-display text-3xl font-black uppercase tracking-tight">{closed ? 'Registration closed' : 'Save your seat'}</h2>
              {closed ? (
                <p className="text-paper/65">{isPast ? 'This event has already happened.' : 'Registration for this event has closed.'}</p>
              ) : e.registration === 'form' && e.formSlug ? (
                left === 0 && !e.waitlist ? <p className="text-paper/65">Sorry — this event is full.</p> : <FormBlock slug={e.formSlug} eventId={e.id} />
              ) : e.registration === 'external' && e.href ? (
                <a href={safeHref(e.href)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-emerald px-7 py-4 font-display text-sm font-black uppercase tracking-wide text-ink hover:bg-emerald-soft">Register →</a>
              ) : (
                <p className="text-paper/65">No registration needed — just show up.</p>
              )}
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
