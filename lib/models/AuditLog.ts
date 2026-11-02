// =============================================================================
// FILE: lib/models/AuditLog.ts — who changed what, when, from where (kept 180 days)
// =============================================================================
import { Schema, type Types } from 'mongoose';
import { model } from './_util';

export interface IAuditLog {
  _id: Types.ObjectId;
  actor: Types.ObjectId | null;
  actorEmail: string;
  action: string;      // e.g. 'post.publish', 'user.create', 'auth.login'
  target: string;      // e.g. 'post:6612…', 'settings'
  ip: string;
  meta: Record<string, unknown>;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actor: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    actorEmail: { type: String, default: '' },
    action: { type: String, required: true, index: true },
    target: { type: String, default: '' },
    ip: { type: String, default: '' },
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'audit_logs' },
);
AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 180 });

export const AuditLog = model<IAuditLog>('AuditLog', AuditLogSchema);
