// FILE: app/(site)/events/page.tsx — upcoming + past events
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import SiteHeader from '@/components/layout/SiteHeader';
import PageHero from '@/components/cms/PageHero';
import { EventRow } from '@/components/cms/Cards';
import { getEvents, isSystemPageEnabled } from '@/lib/cms/queries';

export const metadata: Metadata = { title: 'Events — Cyber Community Pakistan', description: 'Free lectures, workshops and meetups. Register in a minute.' };
export const revalidate = 300;

export default async function EventsPage() {
  if (!(await isSystemPageEnabled('events'))) notFound();
  const events = await getEvents();
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi' }).format(new Date());
  const upcoming = events.filter((e) => (e.endDate ?? e.date) >= today);
  const past = events.filter((e) => (e.endDate ?? e.date) < today).reverse().slice(0, 12);

  return (
    <>
      <SiteHeader />
      <main className="bg-ink text-paper">
        <PageHero eyebrow="Events" title="Come learn with us" body="Lectures, hands-on workshops, webinars and meetups — free, and open to everyone." />
        <section className="px-4 pb-20 sm:px-6 lg:px-10">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-emerald">Upcoming · {upcoming.length}</h2>
          <div className="mt-4 border-b border-paper/10">
            {upcoming.length ? upcoming.map((e) => <EventRow key={e.id} event={e} />) : <p className="border-t border-paper/10 py-10 text-paper/55">No upcoming events right now. Follow us to hear about the next one.</p>}
          </div>
        </section>
        {past.length > 0 && (
          <section className="px-4 pb-28 sm:px-6 lg:px-10">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-paper/50">Past</h2>
            <div className="mt-4 border-b border-paper/10">{past.map((e) => <EventRow key={e.id} event={e} past />)}</div>
          </section>
        )}
      </main>
    </>
  );
}
