// =============================================================================
// FILE: lib/models/SecurityEvent.ts
// Honeypot hits, trap-route probes, rate-limit trips, failed logins (kept 90 days).
// =============================================================================
import { Schema, type Types } from 'mongoose';
import { model } from './_util';

export type SecurityEventType = 'honeypot' | 'trap_route' | 'too_fast' | 'rate_limit' | 'login_failed' | 'login_locked' | 'blocked_request' | 'bad_token';

export interface ISecurityEvent {
  _id: Types.ObjectId;
  type: SecurityEventType;
  ip: string;
  path: string;
  userAgent: string;
  detail: string;
  createdAt: Date;
}

const SecurityEventSchema = new Schema<ISecurityEvent>(
  {
    type: { type: String, required: true, index: true },
    ip: { type: String, required: true, index: true },
    path: { type: String, default: '', maxlength: 300 },
    userAgent: { type: String, default: '', maxlength: 300 },
    detail: { type: String, default: '', maxlength: 500 },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'security_events' },
);
SecurityEventSchema.index({ createdAt: -1 });
SecurityEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

export const SecurityEvent = model<ISecurityEvent>('SecurityEvent', SecurityEventSchema);
