// FILE: components/admin/ConfirmAction.tsx — small button that runs a server action after confirm()
'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { buttonCls, type BtnVariant } from './ui';

export default function ConfirmAction({ action, confirm: question, children, variant = 'danger', className = '', redirectTo }: {
  action: () => Promise<{ ok: boolean; error?: string; message?: string } | null>; confirm?: string; children: React.ReactNode; variant?: BtnVariant; className?: string; redirectTo?: string;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={pending}
      className={buttonCls(variant, `!px-3 !py-1.5 text-[12.5px] ${className}`)}
      onClick={() => {
        if (question && !window.confirm(question)) return;
        start(async () => {
          const r = await action();
          if (r && !r.ok && r.error) window.alert(r.error);
          else if (redirectTo) router.push(redirectTo);
          else router.refresh();
        });
      }}
    >
      {pending ? '…' : children}
    </button>
  );
}
