// =============================================================================
// FILE: prisma/seed.ts
// Fills the database with the built-in content (lib/content/defaults).
//
//   npx prisma db seed          → safe: only fills EMPTY tables / missing sections,
//                                 never overwrites edits made in the admin panel
//   npm run db:reset-content    → wipes content tables and re-seeds everything
//                                 (admin users are never touched)
// =============================================================================

import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../lib/generated/prisma/client';
import { defaultSections, siteDefaults, homeDefaults, aboutDefaults } from '../lib/content/defaults';
import { toEvent, toFaq, toProgram, toTeamMember, toTestimonial } from '../lib/content/mappers';
import type { SectionKey } from '../lib/content/schemas';

const reset = process.argv.includes('--reset');
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL }) });

const log = (name: string, what: string) => console.log(`  ${what.padEnd(9)} ${name}`);

async function fillIfEmpty(name: string, count: () => Promise<number>, wipe: () => Promise<unknown>, create: () => Promise<unknown>) {
  if (reset) await wipe();
  if ((await count()) > 0) return log(name, 'kept');
  await create();
  log(name, 'seeded');
}

async function main() {
  console.log(`Seeding content${reset ? ' (RESET)' : ''}…`);

  // ---- settings ----
  const s = siteDefaults.settings;
  const l = siteDefaults.logo;
  const settingsData = {
    name: s.name,
    shortName: s.short,
    email: s.email,
    applyUrl: s.applyUrl,
    logoUrl: l?.src ?? null,
    logoAlt: l?.alt ?? null,
    logoWidth: l?.width ?? null,
    logoHeight: l?.height ?? null,
    logoDisplayHeight: l?.displayHeight ?? 34,
    logoBlend: l?.blend ?? true,
  };
  await db.siteSettings.upsert({ where: { id: 1 }, create: { id: 1, ...settingsData }, update: reset ? settingsData : {} });
  log('settings', reset ? 'reset' : 'ok');

  // ---- sections ----
  for (const key of Object.keys(defaultSections) as SectionKey[]) {
    const content = defaultSections[key] as object;
    await db.section.upsert({ where: { key }, create: { key, content }, update: reset ? { content } : {} });
  }
  log(`${Object.keys(defaultSections).length} sections`, reset ? 'reset' : 'ok');

  // ---- menu (tree) ----
  await fillIfEmpty(
    'menu',
    () => db.menuItem.count(),
    () => db.menuItem.deleteMany(),
    async () => {
      for (const [i, item] of siteDefaults.menu.entries()) {
        await db.menuItem.create({
          data: {
            label: item.label,
            href: item.children?.length ? null : (item.href ?? null),
            badge: item.badge ?? null,
            order: i,
            children: item.children?.length
              ? {
                  create: item.children.map((c, j) => ({
                    label: c.label,
                    href: c.href,
                    description: c.description ?? null,
                    badge: c.badge ?? null,
                    order: j,
                  })),
                }
              : undefined,
          },
        });
      }
    },
  );

  // ---- simple lists ----
  await fillIfEmpty('social links', () => db.socialLink.count(), () => db.socialLink.deleteMany(), () =>
    db.socialLink.createMany({ data: siteDefaults.socials.map((x, i) => ({ ...x, order: i })) }),
  );
  await fillIfEmpty('footer links', () => db.footerLink.count(), () => db.footerLink.deleteMany(), () =>
    db.footerLink.createMany({ data: siteDefaults.footerLinks.map((x, i) => ({ ...x, order: i })) }),
  );
  await fillIfEmpty('programs', () => db.program.count(), () => db.program.deleteMany(), () =>
    db.program.createMany({ data: homeDefaults.programs.map(toProgram) }),
  );
  await fillIfEmpty('events', () => db.event.count(), () => db.event.deleteMany(), () =>
    db.event.createMany({ data: homeDefaults.events.map(toEvent) }),
  );
  await fillIfEmpty('testimonials', () => db.testimonial.count(), () => db.testimonial.deleteMany(), () =>
    db.testimonial.createMany({ data: homeDefaults.testimonials.map(toTestimonial) }),
  );
  await fillIfEmpty('faqs', () => db.faq.count(), () => db.faq.deleteMany(), () =>
    db.faq.createMany({ data: homeDefaults.faqs.map(toFaq) }),
  );
  await fillIfEmpty('team', () => db.teamMember.count(), () => db.teamMember.deleteMany(), () =>
    db.teamMember.createMany({ data: aboutDefaults.team.map(toTeamMember) }),
  );

  console.log('Done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
