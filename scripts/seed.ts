// =============================================================================
// FILE: scripts/seed.ts
//   pnpm db:seed            → fill an empty database (never overwrites edits)
//   pnpm db:seed --reset    → also restore every section to the default text
// Seeds: settings, sections, menu, socials, footer, programs, events,
// testimonials, FAQ, team, roles (with permissions) and the built-in pages.
// Create the first admin afterwards with `pnpm admin:create`.
// =============================================================================
import 'dotenv/config';
import mongoose from 'mongoose';
import {
  Event, Faq, FooterLink, MenuItem, Page, Program, Role, Section, SiteSettings, SocialLink, TeamMember, Testimonial,
} from '../lib/models';
import { defaultSections, defaultSiteData, defaultHomeData, defaultAboutData } from '../lib/content/defaults';
import { toEvent, toFaq, toProgram, toTeamMember, toTestimonial } from '../lib/content/mappers';
import { DEFAULT_ROLES } from '../lib/auth/permissions';

const reset = process.argv.includes('--reset');

async function fillIfEmpty(name: string, model: mongoose.Model<any>, docs: object[]) {
  if (await model.estimatedDocumentCount()) return console.log(`  · ${name}: kept`);
  if (docs.length) await model.insertMany(docs);
  console.log(`  ✓ ${name}: seeded ${docs.length}`);
}

async function main() {
  const uri = process.env.MONGODB_URI || "";
  if (!uri) throw new Error('MONGODB_URI is not set');
  await mongoose.connect(uri);
  console.log('Seeding', uri.replace(/\/\/[^@]+@/, '//***@'));
  const s = defaultSiteData;

  if (!(await SiteSettings.exists({}))) {
    await SiteSettings.create({ name: s.name, shortName: s.short, email: s.email, applyUrl: s.applyUrl, logoUrl: s.logo?.src ?? null, logoAlt: s.logo?.alt ?? null, logoWidth: s.logo?.width ?? null, logoHeight: s.logo?.height ?? null, logoDisplayHeight: s.logo?.displayHeight ?? 34, logoBlend: s.logo?.blend ?? true });
    console.log('  ✓ settings');
  } else console.log('  · settings: kept');

  for (const [key, content] of Object.entries(defaultSections)) {
    if (reset) await Section.updateOne({ key }, { $set: { content } }, { upsert: true });
    else await Section.updateOne({ key }, { $setOnInsert: { content } }, { upsert: true });
  }
  console.log(`  ✓ sections (${reset ? 'reset' : 'missing only'})`);

  if (!(await MenuItem.estimatedDocumentCount())) {
    for (const [i, m] of s.menu.entries()) {
      const top = await MenuItem.create({ label: m.label, href: m.children ? null : m.href, badge: m.badge ?? null, order: i });
      if (m.children) await MenuItem.insertMany(m.children.map((c, j) => ({ label: c.label, href: c.href, description: c.description ?? null, badge: c.badge ?? null, order: j, parentId: top._id })));
    }
    console.log('  ✓ menu');
  } else console.log('  · menu: kept');

  await fillIfEmpty('socials', SocialLink, s.socials.map((l, i) => ({ ...l, order: i })));
  await fillIfEmpty('footer links', FooterLink, s.footer.nav.map((l, i) => ({ ...l, order: i })));
  await fillIfEmpty('programs', Program, defaultHomeData.programs.map(toProgram));
  await fillIfEmpty('events', Event, defaultHomeData.events.map((e) => ({ ...toEvent(e), registration: 'external' })));
  await fillIfEmpty('testimonials', Testimonial, defaultHomeData.testimonials.map(toTestimonial));
  await fillIfEmpty('faqs', Faq, defaultHomeData.faqs.map(toFaq));
  await fillIfEmpty('team', TeamMember, defaultAboutData.team.map(toTeamMember));

  for (const r of DEFAULT_ROLES) {
    // system roles always get the full, current permission list
    if (r.system) await Role.updateOne({ slug: r.slug }, { $set: { name: r.name, description: r.description, permissions: r.permissions, system: true } }, { upsert: true });
    else await Role.updateOne({ slug: r.slug }, { $setOnInsert: { name: r.name, description: r.description, permissions: r.permissions, system: false } }, { upsert: true });
  }
  console.log('  ✓ roles');

  const system = [['', 'Home', 0], ['about', 'About', 10], ['blog', 'Blog', 20], ['events', 'Events', 30]] as const;
  for (const [slug, title, order] of system) {
    await Page.updateOne({ slug }, { $setOnInsert: { title, system: true, status: 'published', order, blocks: [] } }, { upsert: true });
  }
  console.log('  ✓ built-in pages');

  await mongoose.disconnect();
  console.log('Done. Next: pnpm admin:create');
}

main().catch(async (e) => {
  console.error(e);
  await mongoose.disconnect();
  process.exit(1);
});
