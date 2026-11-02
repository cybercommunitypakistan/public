// =============================================================================
// FILE: lib/models/RateLimit.ts — fixed-window counters (auto-expire)
// =============================================================================
import { Schema, type Types } from 'mongoose';
import { model } from './_util';

export interface IRateLimit {
  _id: Types.ObjectId;
  key: string;
  count: number;
  resetAt: Date;
}

const RateLimitSchema = new Schema<IRateLimit>(
  {
    key: { type: String, required: true, unique: true },
    count: { type: Number, default: 0 },
    resetAt: { type: Date, required: true },
  },
  { collection: 'rate_limits' },
);
RateLimitSchema.index({ resetAt: 1 }, { expireAfterSeconds: 0 });

export const RateLimit = model<IRateLimit>('RateLimit', RateLimitSchema);
