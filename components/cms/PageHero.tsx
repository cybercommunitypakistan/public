// FILE: components/cms/PageHero.tsx — shared header for blog / events / custom pages
export default function PageHero({ eyebrow, title, body, children }: { eyebrow?: string; title: string; body?: string; children?: React.ReactNode }) {
  return (
    <header className="relative overflow-hidden bg-ink px-4 pb-16 pt-36 text-paper sm:px-6 sm:pb-20 sm:pt-44 lg:px-10">
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(var(--color-paper)_1px,transparent_1px),linear-gradient(90deg,var(--color-paper)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(70%_60%_at_30%_30%,#000,transparent)]" />
      <div aria-hidden className="pointer-events-none absolute -right-40 -top-40 size-[520px] rounded-full bg-emerald/20 blur-[120px]" />
      <div className="relative max-w-5xl">
        {eyebrow && <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-emerald">{eyebrow}</p>}
        <h1 className="mt-4 font-display text-[clamp(44px,7vw,120px)] font-black uppercase leading-[0.86] tracking-[-0.05em] text-balance">{title}</h1>
        {body && <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-paper/70">{body}</p>}
        {children}
      </div>
    </header>
  );
}
