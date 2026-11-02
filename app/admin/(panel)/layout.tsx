// =============================================================================
// FILE: app/admin/(panel)/layout.tsx — authenticated shell (sidebar + top bar)
// Every page below also checks its own permission; this only requires sign-in.
// =============================================================================
import { requireUser } from '@/lib/auth/guard';
import Sidebar from '@/components/admin/Sidebar';

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[264px_1fr]">
      <Sidebar user={{ name: user.name, email: user.email, role: user.roleName, permissions: user.permissions }} />
      <div className="min-w-0">
        <main className="mx-auto max-w-[1240px] px-4 pb-24 pt-20 sm:px-8 lg:pt-10">{children}</main>
      </div>
    </div>
  );
}
