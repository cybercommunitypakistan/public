// =============================================================================
// FILE: app/api/admin/export/route.ts — CSV export of responses / registrations
// Requires `submissions.export`. Cells starting with = + - @ are prefixed with '
// to stop spreadsheet formula injection. Every export is audited.
// =============================================================================
import { NextResponse, type NextRequest } from 'next/server';
import { authorize } from '@/lib/auth/guard';
import { db } from '@/lib/db';
import { Event, Form, Submission } from '@/lib/models';
import { isId } from '@/lib/admin/result';
import { audit } from '@/lib/audit';
import type { FormField } from '@/lib/forms/schema';

const cell = (v: unknown) => {
  let s = Array.isArray(v) ? v.join('; ') : typeof v === 'boolean' ? (v ? 'yes' : 'no') : String(v ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

export async function GET(req: NextRequest) {
  const auth = await authorize('submissions.export');
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 403 });
  const formId = req.nextUrl.searchParams.get('form'), eventId = req.nextUrl.searchParams.get('event');
  await db.connect();
  let form, filter: Record<string, unknown>, name: string;
  if (isId(eventId)) {
    const ev = await Event.findById(eventId).lean();
    if (!ev?.form) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    form = await Form.findById(ev.form).lean(); filter = { event: eventId }; name = ev.slug ?? 'event';
  } else if (isId(formId)) {
    form = await Form.findById(formId).lean(); filter = { form: formId }; name = form?.slug ?? 'form';
  } else return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  if (!form) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const fields = (form.fields as unknown as FormField[]).filter((f) => f.type !== 'heading');
  const rows = await Submission.find(filter).sort({ createdAt: 1 }).lean();
  const csv = [
    ['submitted_at', 'status', ...fields.map((f) => f.label)].map(cell).join(','),
    ...rows.map((r) => [r.createdAt.toISOString(), r.status, ...fields.map((f) => (r.data as Record<string, unknown>)[f.id])].map(cell).join(',')),
  ].join('\r\n');
  await audit(auth.user, 'submissions.export', `${isId(eventId) ? 'event' : 'form'}:${name}`, { rows: rows.length });
  return new NextResponse(`﻿${csv}`, {
    headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="${name.replace(/[^a-z0-9-]/g, '')}-${new Date().toISOString().slice(0, 10)}.csv"`, 'cache-control': 'no-store' },
  });
}
