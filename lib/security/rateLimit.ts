// =============================================================================
// FILE: lib/security/rateLimit.ts
// Fixed-window counter stored in MongoDB (works across serverless instances).
//   const r = await rateLimit(`login:ip:${ip}`, 10, 15 * 60)
//   if (!r.ok) → too many requests, retry after r.retryAfter seconds
// =============================================================================
import 'server-only';
import { RateLimit } from '@/lib/models';

export async function rateLimit(key: string, limit: number, windowSec: number) {
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowSec * 1000);
  // reset an expired window, then increment atomically
  await RateLimit.updateOne({ key, resetAt: { $lte: now } }, { $set: { count: 0, resetAt } });
  const row = await RateLimit.findOneAndUpdate(
    { key },
    { $inc: { count: 1 }, $setOnInsert: { resetAt } },
    { upsert: true, new: true },
  ).lean();
  const count = row?.count ?? 1;
  const retryAfter = Math.max(1, Math.ceil(((row?.resetAt ?? resetAt).getTime() - now.getTime()) / 1000));
  return { ok: count <= limit, count, retryAfter };
}

export async function resetRateLimit(key: string) {
  await RateLimit.deleteOne({ key });
}
