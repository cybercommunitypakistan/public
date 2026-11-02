# Cyber Community Pakistan — Website + Admin Panel

Next.js 16 · React 19 · Tailwind v4 · GSAP · Lenis · WebGL2 · MongoDB (Mongoose)

Everything on the public site comes from the database: hero text, sections, menu, logo, colour scheme, pages,
blog, events, forms. Edit it all at **/admin**.

## Setup

```bash
pnpm install
cp .env.example .env.local          # fill MONGODB_URI + SESSION_SECRET at minimum
pnpm db:seed                        # default content, roles, built-in pages (never overwrites edits)
pnpm admin:create                   # first Owner account (asks for email / name / password)
pnpm dev                            # http://localhost:3000  ·  admin: http://localhost:3000/admin
```

Production: `pnpm build && pnpm start`. On Vercel, add the same env vars. Behind Cloudflare, set `IP_HEADER=cf-connecting-ip`.

## What the admin panel does

| Area | Where | Notes |
|---|---|---|
| Dashboard | `/admin` | Counts, next events, recent activity |
| Pages | `/admin/pages` | Page builder (hero, text, image, cards, stats, CTA, FAQ, events, posts, form, video). New URL per page, draft / publish / **disable**. Built-in pages (home, about, blog, events) can be switched off → 404. “Show in menu” adds the page to the navigation. |
| Sections & hero | `/admin/content` | Every text on home/about/menu/footer, incl. the hero wordmark, tagline and buttons |
| Blog | `/admin/blog` | Markdown editor with preview, cover, tags, SEO, scheduling, featured. Authors write, editors publish. Public `/blog`, `/blog/<slug>`, tag filter, pagination |
| Navigation | `/admin/navigation` | Menu with dropdowns, social links, footer links |
| Events | `/admin/events` | Full event pages at `/events/<slug>`, capacity, waitlist, registration deadline, on-site form / external link / none |
| Forms | `/admin/forms` | Google-Forms-style builder: 13 question types, required, options, min/max, half width, limits, closing date, one-per-email, notify email. Responses table, confirm / cancel, CSV export |
| Colour scheme | `/admin/theme` | 6 presets + custom colours with live preview |
| Settings & logo | `/admin/settings` | Name, email, apply link, logo upload (Cloudinary), favicon |
| Users / Roles | `/admin/users`, `/admin/roles` | Roles = permission sets. Default: Owner, Admin, Editor, Event manager, Author. Create your own. |
| Security | `/admin/security` | Security log, honeypot hits, blocked IPs (block / unblock), audit log, bot-protection settings |

## Security (summary)

- **Auth**: bcrypt (cost 12), password policy, server-side sessions (random 256-bit token, only its SHA-256 stored),
  `__Host-` HttpOnly Secure SameSite=Lax cookie, 8 h idle / 7 day absolute expiry, session rotation on login,
  all sessions revoked on password change / disable / role change.
- **Brute force**: 10 sign-ins / 15 min per IP, account lockout after 5 failures (5 → 60 min), same error and same
  bcrypt work for unknown emails, IP auto-block after sustained attacks.
- **RBAC**: 18 permissions checked on every admin page **and** every server action / API route. Nobody can grant a
  role or permission they don't have themselves; there is always one active owner.
- **Honeypots**: hidden trap field + signed fill-time token on every public form and the login page (bots get a fake
  “success”); trap URLs (`/wp-admin`, `/.env`, `/phpmyadmin`, `*.php`, `/internal-archive`…) log and block the IP for 7 days.
- **Input**: zod validation on every write, form answers validated server-side from the form definition,
  Markdown rendered without raw HTML, links filtered (no `javascript:`), CSV exports protected against formula injection,
  uploads checked by magic bytes (no SVG), 5 MB limit.
- **Headers**: CSP, HSTS, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy, COOP/CORP; `/admin` is
  `noindex` and `no-store`. Server Actions are origin-checked by Next.js (CSRF).
- **Locked yourself out?** Testing the honeypot from your own IP blocks it. Run `pnpm security:unblock <ip>` (or `--all`).
- **Logs**: audit log of every admin change (180 days), security events (90 days), TTL-expired automatically.

## Folders

| Path | What |
|---|---|
| `app/(site)/` | Public site (home, about, blog, events, forms, `[...slug]` pages) |
| `app/admin/` | Admin panel (own root layout) · `_actions/` = server actions |
| `app/api/` | upload, CSV export, trap, revalidate |
| `proxy.ts` | Trap routes, admin gate, admin no-cache headers |
| `lib/models/` | Mongoose models |
| `lib/auth/` | sessions, passwords, permissions, guards |
| `lib/security/` | rate limits, honeypots, IP blocking, request IP |
| `lib/cms/` | theme presets, slugs, cached public queries |
| `lib/blocks/registry.ts` | page-builder blocks (add new ones here) |
| `lib/forms/` | form schema + public submit action |
| `components/admin/` | admin UI (ObjectEditor, BlocksEditor, FormBuilder, MarkdownEditor…) |
| `components/blocks/`, `components/cms/` | public renderers |
