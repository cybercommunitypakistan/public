// =============================================================================
// FILE: components/footer/RollText.tsx
// Text that rolls up letter by letter on hover (a second copy rolls in from
// below). Put it inside an element with the `group/roll` class.
// =============================================================================

type Props = {
  text: string;
  /** Colour class of the copy that rolls in (default emerald). */
  hoverClass?: string;
  className?: string;
};

export default function RollText({ text, hoverClass = 'text-emerald', className = '' }: Props) {
  const chars = [...text];
  const letter = (ch: string, i: number, second: boolean) => (
    <span
      key={i}
      className={`inline-block whitespace-pre transition-transform duration-500 ease-[cubic-bezier(.76,0,.24,1)] ${
        second ? 'translate-y-full group-hover/roll:translate-y-0' : 'group-hover/roll:-translate-y-full'
      }`}
      style={{ transitionDelay: `${i * 18}ms` }}
    >
      {ch}
    </span>
  );

  return (
    <span className={`relative inline-flex overflow-hidden align-bottom ${className}`}>
      <span className="sr-only">{text}</span>
      <span aria-hidden className="inline-flex">
        {chars.map((c, i) => letter(c, i, false))}
      </span>
      <span aria-hidden className={`absolute inset-0 inline-flex ${hoverClass}`}>
        {chars.map((c, i) => letter(c, i, true))}
      </span>
    </span>
  );
}
