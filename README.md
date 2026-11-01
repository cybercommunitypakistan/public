# Cyber Community Pakistan — Liquid Ink Hero

Next.js 16 · React 19 · Tailwind CSS v4 · GSAP · Lenis · WebGL2 · Prisma 7 + Supabase Postgres

**Content is dynamic** — see **[SETUP.md](./SETUP.md)** to connect Supabase, create the tables and seed them.

## Run
```bash
npm install
npm run dev        # http://localhost:3000
```

## Add to an existing Next.js app
```bash
npm i gsap @gsap/react lenis @fontsource-variable/archivo @fontsource-variable/inter-tight @fontsource-variable/jetbrains-mono
```
Copy `lib/`, `components/`, merge `app/globals.css` (the @theme tokens + `[data-fx]` + keyframes),
and wrap your layout's `<body>` content with `<SmoothScroll>` (see `app/layout.tsx`).

## Files
| File | What it does |
|---|---|
| `prisma/schema.prisma` | Database tables |
| `prisma/seed.ts` | Fills the database with the default content |
| `lib/content/queries.ts` | Cached database reads used by the pages |
| `lib/content/schemas.ts` | Section keys + fields (zod) |
| `lib/content/defaults/` | Default content (seed + fallback) |
| `components/providers/SiteProvider.tsx` | Global site data for client components (`useSite()`) |
| `lib/gsap.ts` | Registers GSAP plugins (import gsap from here) |
| `lib/fonts.ts` | Wordmark font name/weight for the canvas |
| `components/providers/SmoothScroll.tsx` | Lenis, synced with GSAP ticker + ScrollTrigger |
| `components/layout/SiteHeader.tsx` | Fixed blend-mode header |
| `components/layout/MenuOverlay.tsx` | Full-screen GSAP menu |
| `components/hero/CyberHero.tsx` | Hero layout + GSAP intro/scroll timelines |
| `components/hero/RotatingBadge.tsx` | Spinning "Apply now" badge |
| `components/hero/ink/InkCanvas.tsx` | React wrapper for the engine |
| `components/hero/ink/InkEngine.ts` | WebGL2 ink simulation + rendering |
| `components/hero/ink/shaders.ts` | GLSL shaders (ink field, cyber texture) |
| `components/sections/IntroSection.tsx` | Next section (navy) with scroll reveals |

## Tweaks (in `CyberHero.tsx` → `<InkCanvas … />`)
- `lifetime` — seconds the ink stays (default 1.7)
- `brush` — brush size multiplier
- `autoplay={false}` — disable the idle ghost cursor
- `textureSrc="/your-photo.jpg"` — show a photo inside the letters instead of the emerald texture
- `colors={{ paper, ink }}` — background & ink colours
