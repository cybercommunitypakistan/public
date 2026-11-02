// =============================================================================
// FILE: scripts/unblock.ts — lift an IP block from the terminal (e.g. you tripped a honeypot while testing)
//   pnpm security:unblock 203.0.113.7
//   pnpm security:unblock --all
// =============================================================================
import 'dotenv/config';
import mongoose from 'mongoose';
import { BlockedIp, RateLimit } from '../lib/models';

async function main() {
  const arg = process.argv[2];
  if (!arg) throw new Error('Usage: pnpm security:unblock <ip> | --all');
  const uri = process.env.MONGODB_URI || "";
  if (!uri) throw new Error('MONGODB_URI is not set');
  await mongoose.connect(uri);
  const r = arg === '--all' ? await BlockedIp.deleteMany({}) : await BlockedIp.deleteMany({ ip: arg });
  if (arg !== '--all') await RateLimit.deleteMany({ key: { $regex: `ip:${arg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$` } });
  console.log(`✓ removed ${r.deletedCount} block(s)`);
  await mongoose.disconnect();
}
main().catch(async (e) => { console.error('✗', e.message); await mongoose.disconnect(); process.exit(1); });
