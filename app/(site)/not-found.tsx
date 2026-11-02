// FILE: app/(site)/not-found.tsx
import Link from 'next/link';
import SiteHeader from '@/components/layout/SiteHeader';

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="grid min-h-screen place-items-center bg-ink px-4 text-paper">
        <div className="text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-emerald">Error 404</p>
          <h1 className="mt-4 font-display text-[clamp(64px,14vw,220px)] font-black uppercase leading-[0.8] tracking-[-0.06em]">Lost?</h1>
          <p className="mx-auto mt-6 max-w-md text-paper/65">This page doesn’t exist or has been switched off.</p>
          <Link href="/" className="mt-9 inline-flex rounded-full bg-emerald px-7 py-4 font-display text-sm font-black uppercase tracking-wide text-ink hover:bg-emerald-soft">Back home</Link>
        </div>
      </main>
    </>
  );
}
