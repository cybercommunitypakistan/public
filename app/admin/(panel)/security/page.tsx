// FILE: app/admin/(panel)/security/page.tsx — security log, honeypots, blocked IPs, audit log
import Link from 'next/link';
import { requirePermission, can } from '@/lib/auth/guard';
import { db } from '@/lib/db';
import { AuditLog, BlockedIp, SecurityEvent, SiteSettings } from '@/lib/models';
import ActionForm, { FieldError, SubmitButton } from '@/components/admin/ActionForm';
import ConfirmAction from '@/components/admin/ConfirmAction';
import { Badge, Card, Field, PageHeader, Table, Td, fmtDate, inputCls } from '@/components/admin/ui';
import { addBlock, unblock } from '../../_actions/security';
import { saveSecuritySettings } from '../../_actions/settings';

export const metadata = { title: 'Security' };
const tone: Record<string, 'red' | 'amber' | 'blue' | 'neutral'> = { honeypot: 'red', trap_route: 'red', blocked_request: 'red', login_locked: 'amber', login_failed: 'amber', rate_limit: 'amber', too_fast: 'blue', bad_token: 'blue' };

export default async function SecurityPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const user = await requirePermission('security.view');
  const tab = (await searchParams).tab ?? 'events';
  const manage = can(user, 'security.manage');
  await db.connect();
  const day = new Date(Date.now() - 86400_000);
  const [byType, events, blocked, audits, settings] = await Promise.all([
    SecurityEvent.aggregate([{ $match: { createdAt: { $gte: day } } }, { $group: { _id: '$type', n: { $sum: 1 } } }]),
    tab === 'events' ? SecurityEvent.find().sort({ createdAt: -1 }).limit(200).lean() : [],
    BlockedIp.find({ $or: [{ until: null }, { until: { $gt: new Date() } }] }).sort({ createdAt: -1 }).limit(300).lean(),
    tab === 'audit' ? AuditLog.find().sort({ createdAt: -1 }).limit(200).lean() : [],
    SiteSettings.findOne().select('security').lean(),
  ]);
  const t = Object.fromEntries(byType.map((r) => [r._id, r.n])) as Record<string, number>;
  const cards: [string, number][] = [['Honeypot hits', t.honeypot ?? 0], ['Trap-route probes', t.trap_route ?? 0], ['Failed logins', (t.login_failed ?? 0) + (t.login_locked ?? 0)], ['Bots (too fast / bad token)', (t.too_fast ?? 0) + (t.bad_token ?? 0)], ['Blocked IPs now', blocked.length]];
  const tabs = [['events', 'Security log'], ['blocked', 'Blocked IPs'], ['audit', 'Audit log'], ['settings', 'Settings']];

  return (
    <>
      <PageHeader eyebrow="Administration" title="Security" description="Last 24 hours. Honeypot fields on every form, trap URLs for scanners, rate limits and lockouts feed this log automatically." />
      <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {cards.map(([l, v]) => <Card key={l}><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-paper/45">{l}</p><p className={`mt-2 font-display text-3xl font-black ${v ? 'text-rose' : 'text-paper'}`}>{v}</p></Card>)}
      </div>
      <div className="my-6 flex gap-1 border-b border-white/[0.07]">
        {tabs.map(([v, l]) => <Link key={v} href={`/admin/security?tab=${v}`} className={`-mb-px border-b-2 px-4 py-2.5 text-[13px] ${tab === v ? 'border-emerald text-paper' : 'border-transparent text-paper/50 hover:text-paper'}`}>{l}</Link>)}
      </div>

      {tab === 'events' && (
        <Card padded={false}>
          <Table head={['When', 'Type', 'IP', 'Path', 'Detail']}>
            {events.map((e) => (
              <tr key={String(e._id)}>
                <Td className="whitespace-nowrap text-paper/50">{fmtDate(e.createdAt, true)}</Td>
                <Td><Badge tone={tone[e.type] ?? 'neutral'}>{e.type.replace('_', ' ')}</Badge></Td>
                <Td className="font-mono text-[12px]">{e.ip}</Td>
                <Td className="max-w-[180px] truncate font-mono text-[12px] text-paper/55">{e.path}</Td>
                <Td className="max-w-[340px] truncate text-paper/60" >{e.detail}</Td>
              </tr>
            ))}
            {!events.length && <tr><Td className="py-8 text-paper/45">All quiet.</Td></tr>}
          </Table>
        </Card>
      )}

      {tab === 'blocked' && (
        <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
          <Card padded={false}>
            <Table head={['IP', 'Reason', 'Until', 'Hits', '']}>
              {blocked.map((b) => (
                <tr key={String(b._id)}>
                  <Td className="font-mono text-[12.5px]">{b.ip}</Td>
                  <Td className="max-w-[260px] truncate text-paper/60">{b.reason}</Td>
                  <Td className="text-paper/50">{b.until ? fmtDate(b.until, true) : 'Permanent'}</Td>
                  <Td>{b.hits}</Td>
                  <Td className="text-right">{manage && <ConfirmAction variant="secondary" action={unblock.bind(null, String(b._id))}>Unblock</ConfirmAction>}</Td>
                </tr>
              ))}
              {!blocked.length && <tr><Td className="py-8 text-paper/45">No blocked IPs.</Td></tr>}
            </Table>
          </Card>
          {manage && (
            <Card title="Block an IP">
              <ActionForm action={addBlock} className="grid gap-4" resetOnSuccess>
                <Field label="IP address"><input name="ip" required className={`${inputCls} font-mono`} placeholder="203.0.113.7" /><FieldError name="ip" /></Field>
                <Field label="Reason"><input name="reason" className={inputCls} /></Field>
                <Field label="Duration"><select name="hours" className={inputCls}><option value="24">24 hours</option><option value="168">7 days</option><option value="720">30 days</option><option value="0">Permanent</option></select></Field>
                <SubmitButton variant="danger">Block</SubmitButton>
              </ActionForm>
            </Card>
          )}
        </div>
      )}

      {tab === 'audit' && (
        <Card padded={false}>
          <Table head={['When', 'Who', 'Action', 'Target', 'IP']}>
            {audits.map((a) => (
              <tr key={String(a._id)}>
                <Td className="whitespace-nowrap text-paper/50">{fmtDate(a.createdAt, true)}</Td>
                <Td>{a.actorEmail}</Td>
                <Td><Badge tone={a.action.includes('delete') ? 'red' : a.action.startsWith('auth') ? 'blue' : 'neutral'}>{a.action}</Badge></Td>
                <Td className="max-w-[260px] truncate text-paper/60">{a.target}</Td>
                <Td className="font-mono text-[12px] text-paper/50">{a.ip}</Td>
              </tr>
            ))}
          </Table>
        </Card>
      )}

      {tab === 'settings' && (
        <Card title="Bot protection" description="Applies to every public form and the sign-in page.">
          {manage ? (
            <ActionForm action={saveSecuritySettings} className="grid max-w-xl gap-4 sm:grid-cols-2">
              <Field label="Block IP after honeypot hits" hint="Within 24 hours; block lasts 7 days"><input type="number" name="blockAfterHoneypotHits" min={1} max={20} defaultValue={settings?.security?.blockAfterHoneypotHits ?? 2} className={inputCls} /></Field>
              <Field label="Minimum seconds to fill a form" hint="Faster submissions are treated as bots"><input type="number" name="minFormSeconds" min={0} max={60} defaultValue={settings?.security?.minFormSeconds ?? 3} className={inputCls} /></Field>
              <div className="sm:col-span-2"><SubmitButton>Save</SubmitButton></div>
            </ActionForm>
          ) : <p className="text-[13px] text-paper/50">You can view but not change these settings.</p>}
          <ul className="mt-6 space-y-1.5 border-t border-white/[0.06] pt-5 text-[12.5px] text-paper/55">
            <li>• Trap URLs (/wp-admin, /.env, /phpmyadmin, *.php, /internal-archive…) log the request and block the IP for 7 days.</li>
            <li>• Sign-in: 10 attempts / 15 min per IP, account lock after 5 failures (5 → 60 min), identical errors for unknown emails.</li>
            <li>• Forms: 25 submissions / 10 min per IP, 15 per form per hour (shared campus / mobile IPs still work); bots receive a fake success.</li>
          </ul>
        </Card>
      )}
    </>
  );
}
