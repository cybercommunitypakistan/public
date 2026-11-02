// FILE: app/admin/(panel)/page.tsx — dashboard
import Link from 'next/link';
import { requireUser, can } from '@/lib/auth/guard';
import { db } from '@/lib/db';
import { AuditLog, Event, Page, Post, SecurityEvent, Submission } from '@/lib/models';
import { Card, PageHeader, fmtDate, Badge } from '@/components/admin/ui';

export const metadata = { title: 'Dashboard' };

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const user = await requireUser();
  const { denied } = await searchParams;
  await db.connect();
  const today = new Date(new Date().toISOString().slice(0, 10));
  const week = new Date(Date.now() - 7 * 86400_000), day = new Date(Date.now() - 86400_000);
  const [posts, drafts, pages, upcoming, subs, threats, activity, nextEvents] = await Promise.all([
    Post.countDocuments({ status: 'published' }),
    Post.countDocuments({ status: { $in: ['draft', 'review'] } }),
    Page.countDocuments({ status: 'published', system: false }),
    Event.countDocuments({ published: true, date: { $gte: today } }),
    can(user, 'submissions.view') ? Submission.countDocuments({ createdAt: { $gte: week } }) : Promise.resolve(null),
    can(user, 'security.view') ? SecurityEvent.countDocuments({ createdAt: { $gte: day } }) : Promise.resolve(null),
    AuditLog.find(can(user, 'security.view') ? {} : { actor: user.id }).sort({ createdAt: -1 }).limit(8).lean(),
    Event.find({ published: true, date: { $gte: today } }).sort({ date: 1 }).limit(4).lean(),
  ]);
  const stats: [string, number | null, string, string][] = [
    ['Published posts', posts, `${drafts} in draft / review`, '/admin/blog'],
    ['Live pages', pages, 'built in the page builder', '/admin/pages'],
    ['Upcoming events', upcoming, 'published & in the future', '/admin/events'],
    ['Responses (7d)', subs, 'registrations + form replies', '/admin/forms'],
    ['Security events (24h)', threats, 'honeypots, traps, failed logins', '/admin/security'],
  ];
  const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Karachi', hour: 'numeric', hour12: false }).format(new Date()));
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <>
      {denied && <p className="mb-6 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-[13.5px] text-amber-200">You don’t have access to that area. Ask an owner if you need it.</p>}
      <PageHeader eyebrow={user.roleName} title={`${greet}, ${user.name.split(' ')[0]}`} description="Here’s what’s happening across the website." />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {stats.filter(([, v]) => v !== null).map(([label, value, hint, href]) => (
          <Link key={label} href={href} className="group rounded-2xl border border-white/[0.07] bg-ink-2/55 p-5 transition hover:border-emerald/40">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-paper/45">{label}</p>
            <p className="mt-3 font-display text-4xl font-black tracking-tight text-paper group-hover:text-emerald">{value}</p>
            <p className="mt-1 text-[12px] text-paper/40">{hint}</p>
          </Link>
        ))}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Card title="Next events" className="lg:col-span-2" actions={can(user, 'events.manage') ? <Link href="/admin/events/new" className="text-[12.5px] text-emerald hover:underline">+ New</Link> : null}>
          {nextEvents.length ? (
            <ul className="space-y-3">
              {nextEvents.map((e) => (
                <li key={String(e._id)} className="flex items-center gap-4">
                  <span className="grid w-12 shrink-0 place-items-center rounded-xl bg-white/[0.04] py-1.5 text-center">
                    <span className="font-display text-lg font-black leading-none">{new Date(e.date).getUTCDate()}</span>
                    <span className="font-mono text-[9px] uppercase text-emerald">{new Intl.DateTimeFormat('en', { month: 'short', timeZone: 'UTC' }).format(new Date(e.date))}</span>
                  </span>
                  <Link href={`/admin/events/${e._id}`} className="min-w-0 truncate text-[13.5px] hover:text-emerald">{e.title}</Link>
                </li>
              ))}
            </ul>
          ) : <p className="text-[13px] text-paper/45">No upcoming events.</p>}
        </Card>
        <Card title="Recent activity" className="lg:col-span-3" padded={false}>
          <ul className="divide-y divide-white/[0.05]">
            {activity.map((a) => (
              <li key={String(a._id)} className="flex items-center gap-3 px-5 py-3 text-[13px]">
                <Badge tone={a.action.startsWith('auth') ? 'blue' : a.action.includes('delete') ? 'red' : 'neutral'}>{a.action}</Badge>
                <span className="min-w-0 truncate text-paper/70">{a.target}</span>
                <span className="ml-auto shrink-0 text-[11.5px] text-paper/35">{a.actorEmail} · {fmtDate(a.createdAt, true)}</span>
              </li>
            ))}
            {!activity.length && <li className="px-5 py-6 text-[13px] text-paper/45">Nothing yet.</li>}
          </ul>
        </Card>
      </div>
    </>
  );
}
