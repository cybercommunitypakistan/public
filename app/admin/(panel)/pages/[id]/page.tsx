// FILE: app/admin/(panel)/pages/[id]/page.tsx — page settings + block builder ("new" = create)
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requirePermission, can } from '@/lib/auth/guard';
import { db } from '@/lib/db';
import { Page } from '@/lib/models';
import { isId } from '@/lib/admin/result';
import { BLOCKS } from '@/lib/blocks/registry';
import ActionForm, { FieldError, SubmitButton } from '@/components/admin/ActionForm';
import BlocksEditor from '@/components/admin/BlocksEditor';
import ImageField from '@/components/admin/ImageField';
import { Card, Field, PageHeader, inputCls } from '@/components/admin/ui';
import { savePage } from '../../../_actions/pages';

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission('pages.edit');
  const { id } = await params;
  await db.connect();
  const page = id === 'new' ? null : isId(id) ? await Page.findById(id).lean() : null;
  if (id !== 'new' && !page) notFound();
  const publisher = can(user, 'pages.publish');
  const blocks = page ? JSON.parse(JSON.stringify(page.blocks)) : [
    { id: 'hero-1', type: 'hero', data: BLOCKS.hero.defaults },
    { id: 'text-1', type: 'richText', data: BLOCKS.richText.defaults },
  ];

  return (
    <>
      <PageHeader eyebrow={<Link href="/admin/pages" className="hover:underline">← Pages</Link>} title={page ? page.title : 'New page'}
        actions={page && page.status === 'published' ? <a href={`/${page.slug}`} target="_blank" className="rounded-xl border border-white/12 px-4 py-2.5 text-[13.5px] hover:border-white/25">View live ↗</a> : null} />
      <ActionForm action={savePage} className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <input type="hidden" name="id" value={page ? String(page._id) : ''} />
        <div className="order-2 xl:order-1">
          {page?.system ? (
            <Card title="Built-in page">
              <p className="text-[13.5px] text-paper/60">This page is part of the site’s code. Edit its text under <Link href="/admin/content" className="text-emerald hover:underline">Sections & hero</Link>. Here you can switch it on/off and control its menu entry.</p>
              <input type="hidden" name="title" value={page.title} /><input type="hidden" name="slug" value={page.slug} /><input type="hidden" name="blocks" value="[]" />
            </Card>
          ) : (
            <Card title="Blocks" description="The page is built top to bottom from these blocks.">
              <BlocksEditor initial={blocks} />
            </Card>
          )}
        </div>
        <div className="order-1 space-y-6 xl:order-2 xl:sticky xl:top-8 xl:self-start">
          <Card title="Page">
            <div className="grid gap-4">
              {!page?.system && (
                <>
                  <Field label="Title"><input name="title" defaultValue={page?.title ?? ''} required className={inputCls} /></Field>
                  <label className="block">
                    <span className="mb-1.5 block text-[12.5px] font-medium text-paper/75">URL</span>
                    <div className="flex items-center rounded-xl border border-white/10 bg-white/[0.035] pl-3 focus-within:border-emerald/70">
                      <span className="font-mono text-[13px] text-paper/40">/</span>
                      <input name="slug" defaultValue={page?.slug ?? ''} placeholder="auto from title" className="w-full bg-transparent px-1 py-2.5 font-mono text-[13px] outline-none" />
                    </div>
                    <FieldError name="slug" />
                  </label>
                  <Field label="Meta description" hint="Shown in Google and link previews"><textarea name="description" defaultValue={page?.description ?? ''} rows={3} maxLength={300} className={inputCls} /></Field>
                  <Field label="Share image"><ImageField name="ogImage" defaultValue={page?.ogImage ?? ''} /></Field>
                </>
              )}
              <Field label="Status" hint={publisher ? undefined : 'Only publishers can change this'}>
                <select name="status" defaultValue={page?.status ?? 'draft'} disabled={!publisher} className={inputCls}>
                  <option value="draft">Draft (hidden)</option><option value="published">Published</option><option value="disabled">Disabled (404)</option>
                </select>
              </Field>
              {!publisher && <input type="hidden" name="status" value={page?.status ?? 'draft'} />}
              <label className="flex items-center gap-3 text-[13.5px] text-paper/75"><input type="checkbox" name="showInMenu" defaultChecked={page?.showInMenu ?? false} className="size-4 accent-[var(--color-emerald)]" />Show in the site menu</label>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Menu label"><input name="menuLabel" defaultValue={page?.menuLabel ?? ''} className={inputCls} /></Field>
                <Field label="Menu order"><input name="order" type="number" defaultValue={page?.order ?? 100} className={inputCls} /></Field>
              </div>
              <SubmitButton className="w-full">{page ? 'Save page' : 'Create page'}</SubmitButton>
            </div>
          </Card>
        </div>
      </ActionForm>
    </>
  );
}
