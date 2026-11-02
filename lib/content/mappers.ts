// =============================================================================
// FILE: lib/content/mappers.ts
// Convert database rows ⇄ UI shapes (lib/content/types.ts).
//   from*  = DB row  → UI shape  (used by queries)
//   to*    = UI shape → DB data  (used by the seed and, later, the admin panel)
// =============================================================================

import type {
  IEvent,
  IFaq,
  IMenuItem,
  IProgram,
  ISiteSettings,
  ITeamMember,
  ITestimonial,
} from '../models';
import { EventType, ProgramArt, ProgramStatus, TeamGroup } from '../models';
import type {
  EventItem,
  EventTypeLabel,
  FaqItem,
  MenuItem,
  Program,
  ProgramArtName,
  ProgramStatusLabel,
  SiteLogo,
  TeamGroupId,
  TeamMember,
  Testimonial,
} from './types';

// ---------- enum label maps -----------------------------------------------------

export const programStatusLabel: Record<ProgramStatus, ProgramStatusLabel> = {
  [ProgramStatus.OPEN]: 'Open',
  [ProgramStatus.COMING_SOON]: 'Coming soon',
  [ProgramStatus.ALWAYS_ON]: 'Always on',
};
export const programStatusValue = Object.fromEntries(
  Object.entries(programStatusLabel).map(([k, v]) => [v, k]),
) as Record<ProgramStatusLabel, ProgramStatus>;

export const programArtName = (a: ProgramArt) => a.toLowerCase() as ProgramArtName;
export const programArtValue = (a: ProgramArtName) => a.toUpperCase() as ProgramArt;

const eventTypeLabel = (t: EventType) => (t.charAt(0) + t.slice(1).toLowerCase()) as EventTypeLabel;
export const eventTypeValue = (t: EventTypeLabel) => t.toUpperCase() as EventType;

export const teamGroupId = (g: TeamGroup) => g.toLowerCase() as TeamGroupId;
export const teamGroupValue = (g: TeamGroupId) => g.toUpperCase() as TeamGroup;

const opt = (v: string | null | undefined) => (v ? v : undefined);

// ---------- settings ----------------------------------------------------------------

export function fromSettingsLogo(s: ISiteSettings): SiteLogo | null {
  if (!s.logoUrl) return null;
  return {
    src: s.logoUrl,
    alt: s.logoAlt || s.name,
    width: s.logoWidth || 180,
    height: s.logoHeight || 40,
    displayHeight: s.logoDisplayHeight,
    blend: s.logoBlend,
  };
}

// ---------- menu (flat rows → tree) ------------------------------------------------

export function fromMenuRows(rows: any[]): MenuItem[] {
  const visible = rows.filter((r) => r.visible).sort((a, b) => a.order - b.order);
  return visible
    .filter((r) => !r.parentId)
    .map((top) => {
      const children = visible
        .filter((c) => c.parentId?.toString() === top._id.toString())
        .map((c) => ({ label: c.label, href: c.href ?? '#', description: opt(c.description), badge: opt(c.badge) }));
      return {
        label: top.label,
        href: children.length ? undefined : (top.href ?? '#'),
        badge: opt(top.badge),
        children: children.length ? children : undefined,
      };
    });
}

// ---------- home ------------------------------------------------------------------------

export const fromProgram = (p: any): Program => ({
  id: p._id.toString(),
  title: p.title,
  level: p.level,
  status: programStatusLabel[p.status as ProgramStatus],
  description: p.description,
  meta: p.meta,
  cta: { label: p.ctaLabel, href: p.ctaHref },
  art: programArtName(p.art),
  featured: p.featured,
});

export const toProgram = (p: Program, order: number) => ({
  title: p.title,
  level: p.level,
  status: programStatusValue[p.status],
  description: p.description,
  meta: p.meta,
  ctaLabel: p.cta.label,
  ctaHref: p.cta.href,
  art: programArtValue(p.art),
  featured: Boolean(p.featured),
  order,
});

/** DB `date` columns come back as UTC midnight → keep the calendar day. */
export const isoDay = (d: Date) => d.toISOString().slice(0, 10);

export const fromEvent = (e: any): EventItem => ({
  id: e._id.toString(),
  date: isoDay(e.date),
  title: e.title,
  type: eventTypeLabel(e.type),
  series: opt(e.series),
  format: e.format,
  description: e.description,
  href: e.slug ? `/events/${e.slug}` : e.href,
});

export const toEvent = (e: EventItem) => ({
  date: new Date(`${e.date}T00:00:00Z`),
  title: e.title,
  type: eventTypeValue(e.type),
  series: e.series ?? null,
  format: e.format,
  description: e.description,
  href: e.href,
});

export const fromTestimonial = (t: any): Testimonial => ({
  id: t._id.toString(),
  quote: t.quote,
  name: t.name,
  role: t.role,
  avatarUrl: opt(t.avatarUrl),
  placeholder: t.isSample,
});

export const toTestimonial = (t: Testimonial, order: number) => ({
  quote: t.quote,
  name: t.name,
  role: t.role,
  avatarUrl: t.avatarUrl ?? null,
  isSample: Boolean(t.placeholder),
  order,
});

export const fromFaq = (f: any): FaqItem => ({ id: f._id.toString(), q: f.question, a: f.answer });
export const toFaq = (f: FaqItem, order: number) => ({ question: f.q, answer: f.a, order });

// ---------- team ---------------------------------------------------------------------------

export const fromTeamMember = (m: any): TeamMember => ({
  id: m._id.toString(),
  name: m.name,
  role: m.role,
  group: teamGroupId(m.group),
  city: opt(m.city),
  photo: opt(m.photoUrl),
  links: {
    linkedin: opt(m.linkedin),
    x: opt(m.x),
    github: opt(m.github),
    email: opt(m.email),
  },
});

export const toTeamMember = (m: TeamMember, order: number) => ({
  name: m.name,
  role: m.role,
  group: teamGroupValue(m.group),
  city: m.city ?? null,
  photoUrl: m.photo ?? null,
  linkedin: m.links?.linkedin ?? null,
  x: m.links?.x ?? null,
  github: m.links?.github ?? null,
  email: m.links?.email ?? null,
  order,
});
