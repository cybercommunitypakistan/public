// =============================================================================
// FILE: scripts/check-blocks.ts — Check for rate limits and IP blocks
// =============================================================================
import 'dotenv/config';
import mongoose from 'mongoose';
import { BlockedIp, RateLimit, SecurityEvent } from '../lib/models';

async function main() {
  const uri = process.env.MONGODB_URI || "mongodb+srv://muhammadabdullahkhaver_db_user:LvFzbgR0ZtzKcjfJ@cluster0.acxtpsm.mongodb.net/";
  if (!uri) throw new Error('MONGODB_URI is not set');
  
  await mongoose.connect(uri);
  console.log('🔍 Checking security blocks...\n');

  // Check blocked IPs
  const blockedIps = await BlockedIp.find().lean();
  console.log(`🚫 Blocked IPs: ${blockedIps.length}`);
  for (const block of blockedIps) {
    console.log(`   IP: ${block.ip}`);
    console.log(`   Reason: ${block.reason}`);
    console.log(`   Expires: ${block.until || 'Permanent'}`);
    console.log(`   Hits: ${block.hits}`);
    console.log('');
  }

  // Check rate limits
  const rateLimits = await RateLimit.find().lean();
  console.log(`⏱️  Active Rate Limits: ${rateLimits.length}`);
  for (const limit of rateLimits) {
    console.log(`   Key: ${limit.key}`);
    console.log(`   Count: ${limit.count}`);
    console.log(`   Resets At: ${limit.resetAt}`);
    console.log('');
  }

  // Check recent security events
  const events = await SecurityEvent.find().sort({ createdAt: -1 }).limit(10).lean();
  console.log(`🔐 Recent Security Events (last 10):`);
  for (const event of events) {
    console.log(`   [${event.createdAt.toISOString()}] ${event.type}: ${event.detail || 'N/A'}`);
  }

  await mongoose.disconnect();
  console.log('\n✅ Check complete');
}

main().catch(async (e) => {
  console.error('❌ Error:', e.message);
  await mongoose.disconnect();
  process.exit(1);
});
