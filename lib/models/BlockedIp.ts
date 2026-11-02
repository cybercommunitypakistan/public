// =============================================================================
// FILE: lib/models/BlockedIp.ts — temporary or permanent IP bans
// =============================================================================
import { Schema, type Types } from 'mongoose';
import { model } from './_util';

export interface IBlockedIp {
  _id: Types.ObjectId;
  ip: string;
  reason: string;
  until: Date | null; // null = permanent
  hits: number;
  createdAt: Date;
}

const BlockedIpSchema = new Schema<IBlockedIp>(
  {
    ip: { type: String, required: true, unique: true },
    reason: { type: String, default: '' },
    until: { type: Date, default: null },
    hits: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'blocked_ips' },
);
BlockedIpSchema.index({ until: 1 }, { expireAfterSeconds: 0, partialFilterExpression: { until: { $type: 'date' } } });

export const BlockedIp = model<IBlockedIp>('BlockedIp', BlockedIpSchema);
