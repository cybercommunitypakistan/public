// =============================================================================
// FILE: lib/db.ts
// MongoDB connection using Mongoose (server only).
// One shared connection in dev so hot reloads don't open new connections.
// =============================================================================

import 'server-only';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || '';

/** True when a database is configured. Without it the site uses built-in defaults. */
export const hasDatabase = Boolean(MONGODB_URI);

if (!MONGODB_URI && process.env.NODE_ENV === 'production') {
  console.warn('[db] No MONGODB_URI found. Site will use built-in defaults.');
}

const cached = (globalThis.__mongooseCache ??= { conn: null, promise: null });

async function connectDB() {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined');
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => {
      if (process.env.NODE_ENV !== 'production') console.log('[db] MongoDB connected');
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export const db = {
  connect: connectDB,
  mongoose,
};

// Auto-connect in production
if (process.env.NODE_ENV === 'production' && hasDatabase) {
  connectDB().catch((err) => {
    console.error('[db] Connection error:', err);
  });
}

// Type augmentation for global
declare global {
  var __mongooseCache: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  } | undefined;
}
