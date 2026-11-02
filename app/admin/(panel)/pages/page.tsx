// FILE: app/admin/(panel)/pages/page.tsx — built-in + custom pages, enable/disable
import Link from 'next/link';
import { requirePermission, can } from '@/lib/auth/guard';
import { db } from '@/lib/db';
import { Page } from '@/lib/models';
import ConfirmAction from '@/components/admin/ConfirmAction';
import { Badge, Card, EmptyState, LinkButton, PageHeader, Table, Td, fmtDate } from '@/components/admin/ui';
import { deletePage, setPageStatus } from '../../_actions/pages';

export const metadata = { title: 'Pages' };
const tone = { published: 'green', draft: 'amber', disabled: 'red' } as const;

export default async function PagesPage() {
  const user = await requirePermission('pages.edit');
  const publisher = can(user, 'pages.publish');
  await db.connect();
  const pages = await Page.find().sort({ system: -1, order: 1, title: 1 }).lean();
  const system = pages.filter((p) => p.system), custom = pages.filter((p) => !p.system);

  const Row = ({ p }: { p: (typeof pages)[number] }) => (
    <tr className="hover:bg-white/[0.02]">
      <Td><Link href={`/admin/pages/${p._id}`} className="font-medium text-paper hover:text-emerald">{p.title}</Link>{p.system && <span className="ml-2"><Badge>built-in</Badge></span>}</Td>
      <Td><a href={`/${p.slug}`} target="_blank" className="font-mono text-[12px] text-paper/55 hover:text-emerald">/{p.slug}</a></Td>
      <Td><Badge tone={tone[p.status]}>{p.status}</Badge>{p.showInMenu && <span className="ml-1.5"><Badge tone="blue">menu</Badge></span>}</Td>
      <Td className="text-paper/45">{fmtDate(p.updatedAt)}</Td>
      <Td className="text-right">
        {publisher && (
          <div className="flex justify-end gap-1.5">
            {p.status === 'published'
              ? <ConfirmAction variant="secondary" confirm={`Disable /${p.slug}? Visitors will get a 404.`} action={setPageStatus.bind(null, String(p._id), 'disabled')}>Disable</ConfirmAction>
              : <ConfirmAction variant="secondary" action={setPageStatus.bind(null, String(p._id), 'published')}>{p.system ? 'Enable' : 'Publish'}</ConfirmAction>}
            {!p.system && <ConfirmAction confirm={`Delete “${p.title}” permanently?`} action={deletePage.bind(null, String(p._id))}>Delete</ConfirmAction>}
          </div>
        )}
      </Td>
    </tr>
  );

  return (
    <>
      <PageHeader eyebrow="Content" title="Pages" description="Built-in pages can be switched off. Build new pages from blocks — each gets its own URL." actions={<LinkButton href="/admin/pages/new">+ New page</LinkButton>} />
      <div className="space-y-6">
        <Card title="Built-in pages" padded={false}>
          <Table head={['Page', 'URL', 'Status', 'Updated', '']}>{system.map((p) => <Row key={String(p._id)} p={p} />)}</Table>
        </Card>
        <Card title="Your pages" padded={false}>
          {custom.length ? <Table head={['Page', 'URL', 'Status', 'Updated', '']}>{custom.map((p) => <Row key={String(p._id)} p={p} />)}</Table>
            : <div className="p-5"><EmptyState title="No custom pages yet" body="Create a landing page for a program, a partner page or anything else." action={<LinkButton href="/admin/pages/new">Create a page</LinkButton>} /></div>}
        </Card>
      </div>
    </>
  );
}
