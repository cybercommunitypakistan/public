// =============================================================================
// FILE: lib/db.ts
// Prisma client (server only). Prisma 7 talks to Postgres through the `pg`
// driver adapter using the pooled Supabase URL (DATABASE_URL).
// One shared client in dev so hot reloads don't open new pools.
// =============================================================================

import 'server-only';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/lib/generated/prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  // Use connection pooling for better performance
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
  
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ 
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

/** True when a database is configured. Without it the site uses built-in defaults. */
export const hasDatabase = Boolean(process.env.DATABASE_URL);

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
