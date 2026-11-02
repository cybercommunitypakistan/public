// FILE: components/admin/Responses.tsx — responses / registrations table (server component)
import { can } from '@/lib/auth/guard';
import type { CurrentUser } from '@/lib/auth/session';
import type { FormField } from '@/lib/forms/schema';
import ConfirmAction from './ConfirmAction';
import { Badge, Card, EmptyState, Table, Td, fmtDate } from './ui';
import { deleteSubmission, setSubmissionStatus } from '@/app/admin/_actions/forms';

type Row = { _id: string; data: Record<string, unknown>; status: string; createdAt: Date };
const tone = { new: 'blue', confirmed: 'green', waitlist: 'amber', cancelled: 'red' } as const;
const show = (v: unknown) => (Array.isArray(v) ? v.join(', ') : typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v ?? ''));

export default function Responses({ user, fields, rows, exportHref, total }: { user: CurrentUser; fields: FormField[]; rows: Row[]; exportHref: string; total: number }) {
  const cols = fields.filter((f) => f.type !== 'heading').slice(0, 6);
  const canData = can(user, 'submissions.export');
  return (
    <Card padded={false} title={`${total} response${total === 1 ? '' : 's'}`} description={total > rows.length ? `Showing the latest ${rows.length}. Export for all.` : undefined}
      actions={canData && total > 0 ? <a href={exportHref} className="rounded-xl border border-white/12 px-3.5 py-2 text-[13px] hover:border-emerald hover:text-emerald">Export CSV ↓</a> : null}>
      {rows.length ? (
        <Table head={['Submitted', ...cols.map((c) => c.label.slice(0, 28)), 'Status', '']}>
          {rows.map((r) => {
            const id = String(r._id);
            return (
              <tr key={id} className="align-top hover:bg-white/[0.02]">
                <Td className="whitespace-nowrap text-paper/50">{fmtDate(r.createdAt, true)}</Td>
                {cols.map((c) => <Td key={c.id} className="max-w-[220px] truncate">{show(r.data[c.id])}</Td>)}
                <Td><Badge tone={tone[r.status as keyof typeof tone] ?? 'neutral'}>{r.status}</Badge></Td>
                <Td className="text-right">
                  <div className="flex justify-end gap-1">
                    {r.status !== 'confirmed' && <ConfirmAction variant="secondary" action={setSubmissionStatus.bind(null, id, 'confirmed')}>Confirm</ConfirmAction>}
                    {r.status !== 'cancelled' && <ConfirmAction variant="secondary" action={setSubmissionStatus.bind(null, id, 'cancelled')}>Cancel</ConfirmAction>}
                    {canData && <ConfirmAction confirm="Delete this response permanently?" action={deleteSubmission.bind(null, id)}>✕</ConfirmAction>}
                  </div>
                </Td>
              </tr>
            );
          })}
        </Table>
      ) : <div className="p-5"><EmptyState title="No responses yet" body="Share the link — responses appear here in real time." /></div>}
    </Card>
  );
}
