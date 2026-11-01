# Database setup — Supabase + Prisma

All site content (text, menu, programs, events, testimonials, FAQ, team) now
lives in the database. The admin panel (next step) will edit it; until then
you can edit with **Prisma Studio** or the **Supabase table editor**.

## 1. Create the database
1. Create a project at supabase.com.
2. **Project Settings → Database → Connection string**
   - **Transaction pooler** (port **6543**) → `DATABASE_URL` — add `?pgbouncer=true`
   - **Session pooler / Direct** (port **5432**) → `DIRECT_URL`

## 2. Configure
```bash
cp .env.example .env      # fill DATABASE_URL, DIRECT_URL, REVALIDATE_SECRET
pnpm install              # also runs `prisma generate`
```

## 3. Create tables + fill with the current content
```bash
pnpm db:migrate --name init   # creates prisma/migrations and the tables
pnpm db:seed                  # fills every table with the current site content
pnpm dev
```

## Everyday commands
| Command | What it does |
|---|---|
| `pnpm db:studio` | Visual editor for all tables (localhost:5555) |
| `pnpm db:seed` | Safe: only fills **empty** tables / missing sections |
| `pnpm db:reset-content` | ⚠ Wipes content tables and re-seeds defaults (admin users kept) |
| `pnpm db:migrate` | After changing `prisma/schema.prisma` (local) |
| `pnpm db:deploy` | Apply migrations in production (CI / Vercel build) |

## How updates reach the site
- Pages are pre-built and cached. Content refreshes **automatically every 5 minutes**.
- Admin panel saves (next step) refresh **instantly**.
- After editing directly in Supabase / Studio, refresh instantly with:
  ```bash
  curl -X POST https://your-site/api/revalidate -H "x-revalidate-secret: $REVALIDATE_SECRET"
  # or only some parts: -d '{"tags":["programs","events"]}'
  ```
  Tags: `site`, `sections`, `programs`, `events`, `testimonials`, `faqs`, `team`.
- If the database is unreachable, the site keeps working using the built-in
  defaults in `lib/content/defaults/` (and logs `[content] … using defaults`).

## Where things are
| Content | Table / key |
|---|---|
| Name, email, Ambassador form, logo | `SiteSettings` (one row) |
| Menu + dropdowns | `MenuItem` (`parentId` = dropdown parent) |
| Social links / footer links | `SocialLink` / `FooterLink` |
| Programs, Events, Testimonials, FAQ | `Program`, `Event`, `Testimonial`, `Faq` |
| Team | `TeamMember` |
| Section text (hero, manifesto, SecureHer, footer…) | `Section` — `key` + JSON `content` |

Section keys and their fields are defined in `lib/content/schemas.ts`:
`site.menuFeature`, `site.footer`, `home.hero`, `home.manifesto`,
`home.programs`, `home.secureher`, `home.events`, `home.testimonials`,
`home.faq`, `about.hero`, `about.intro`, `about.team`.
Invalid or missing fields fall back to the defaults, so a typo never breaks a page.

## Vercel
Add the same env vars. Build command stays `pnpm build` (runs `prisma generate`).
Run `pnpm db:deploy` once per schema change (or add it to the build command).
