// FILE: app/admin/(panel)/account/page.tsx — own profile + password
import { requireUser } from '@/lib/auth/guard';
import ActionForm, { FieldError, SubmitButton } from '@/components/admin/ActionForm';
import { Card, Field, PageHeader, inputCls } from '@/components/admin/ui';
import { changeOwnPassword, updateOwnName } from '../../_actions/users';

export const metadata = { title: 'Your account' };

export default async function AccountPage() {
  const me = await requireUser();
  return (
    <>
      <PageHeader eyebrow={me.roleName} title="Your account" description={me.email} />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Profile">
          <ActionForm action={updateOwnName} className="grid gap-4">
            <Field label="Name"><input name="name" defaultValue={me.name} required className={inputCls} /></Field>
            <div><SubmitButton>Save</SubmitButton></div>
          </ActionForm>
        </Card>
        <Card title="Change password" description="You’ll be signed out everywhere afterwards.">
          <ActionForm action={changeOwnPassword} className="grid gap-4">
            <Field label="Current password"><input name="current" type="password" autoComplete="current-password" required className={inputCls} /><FieldError name="current" /></Field>
            <Field label="New password" hint="12+ characters, mix of letters, numbers and symbols"><input name="next" type="password" autoComplete="new-password" required className={inputCls} /><FieldError name="next" /></Field>
            <Field label="Repeat new password"><input name="confirm" type="password" autoComplete="new-password" required className={inputCls} /><FieldError name="confirm" /></Field>
            <div><SubmitButton>Change password</SubmitButton></div>
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
