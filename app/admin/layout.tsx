// =============================================================================
// FILE: app/admin/layout.tsx — separate root layout for the admin panel
// (no smooth scroll, no site header/footer, never indexed)
// =============================================================================
import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/archivo';
import '@fontsource-variable/inter-tight';
import '@fontsource-variable/jetbrains-mono';
import '../globals.css';

export const metadata: Metadata = { title: { default: 'Admin — CCP', template: '%s · Admin — CCP' }, robots: { index: false, follow: false } };
export const viewport: Viewport = { themeColor: '#04111d' };
export const dynamic = 'force-dynamic';

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-ink-deep text-paper antialiased [scrollbar-width:thin]">{children}</body>
    </html>
  );
}
