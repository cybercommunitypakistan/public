// =============================================================================
// FILE: prisma.config.ts
// Prisma 7 config. The CLI (migrate / db push / studio) uses DIRECT_URL —
// Supabase's direct connection (port 5432). The app itself connects through
// the pooled DATABASE_URL (port 6543) in lib/db.ts.
// =============================================================================

import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: env('DIRECT_URL'),
  },
});
