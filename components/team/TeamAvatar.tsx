// =============================================================================
// FILE: components/team/TeamAvatar.tsx
// Auto-generated portrait used when a team member has no photo:
// big initials on a navy "circuit" backdrop with a glow whose position and
// tint are derived from the member (so every avatar looks different).
// =============================================================================

type Props = { name: string; role: string; index: number };

function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function initials(name: string, role: string) {
  // placeholder names → use the role so previews still look varied
  const src = /^team member$/i.test(name.trim()) ? role.replace(/&/g, ' ') : name;
  const parts = src.split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : parts[0]?.[1] ?? '')).toUpperCase();
}

// hex outline tile (emerald, very faint)
const HEX =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='48.5' viewBox='0 0 28 48.5'%3E%3Cpath d='M14 0l14 8.08v16.17L14 32.33 0 24.25V8.08zM14 32.33v16.17' fill='none' stroke='%2314b87a' stroke-opacity='.16' stroke-width='1'/%3E%3C/svg%3E\")";

export default function TeamAvatar({ name, role, index }: Props) {
  const h = hash(name + role + index);
  const gx = 20 + (h % 60); // glow position %
  const gy = 15 + ((h >> 8) % 50);
  const tilt = ((h >> 16) % 30) - 15; // deg
  const hue = (h >> 4) % 2 === 0 ? '20,184,122' : '95,224,170';

  return (
    <div
      aria-hidden
      className="absolute inset-0 overflow-hidden bg-ink-2"
      style={{
        backgroundImage: `radial-gradient(120% 90% at ${gx}% ${gy}%, rgba(${hue},.38), transparent 55%), ${HEX}`,
        backgroundSize: 'auto, 28px 48.5px',
      }}
    >
      {/* diagonal circuit lines */}
      <div
        className="absolute -inset-1/2 opacity-30"
        style={{
          transform: `rotate(${tilt}deg)`,
          backgroundImage: 'repeating-linear-gradient(90deg, rgba(243,245,244,.07) 0 1px, transparent 1px 46px)',
        }}
      />
      {/* initials */}
      <span className="absolute inset-0 grid place-items-center font-display text-[clamp(56px,9vw,112px)] font-black leading-none tracking-[-0.06em] text-paper/90 mix-blend-overlay">
        {initials(name, role)}
      </span>
      <span className="absolute inset-0 grid place-items-center font-display text-[clamp(56px,9vw,112px)] font-black leading-none tracking-[-0.06em] text-transparent [-webkit-text-stroke:1px_rgba(95,224,170,.55)]">
        {initials(name, role)}
      </span>
    </div>
  );
}
