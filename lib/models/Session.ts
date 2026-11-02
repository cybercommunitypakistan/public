// =============================================================================
// FILE: lib/models/Session.ts
// Server-side sessions. The browser cookie holds a random token; only its
// SHA-256 hash is stored, so a database leak doesn't leak live sessions.
// =============================================================================
import { Schema, type Types } from 'mongoose';
import { model } from './_util';

export interface ISession {
  _id: Types.ObjectId;
  tokenHash: string;
  user: Types.ObjectId;
  expiresAt: Date;   // absolute expiry
  idleUntil: Date;   // sliding expiry
  ip: string;
  userAgent: string;
  createdAt: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    tokenHash: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    expiresAt: { type: Date, required: true },
    idleUntil: { type: Date, required: true },
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '', maxlength: 300 },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'sessions' },
);
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Session = model<ISession>('Session', SessionSchema);
