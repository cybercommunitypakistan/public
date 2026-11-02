// =============================================================================
// FILE: lib/models/User.ts
// Admin panel accounts. Passwords are bcrypt hashes; the hash is never selected
// unless asked for explicitly (`.select('+passwordHash')`).
// =============================================================================
import { Schema, type Types } from 'mongoose';
import { model } from './_util';

export interface IUser {
  _id: Types.ObjectId;
  email: string;
  name: string;
  passwordHash: string;
  role: Types.ObjectId;
  status: 'active' | 'disabled';
  failedLogins: number;
  lockedUntil: Date | null;
  lastLoginAt: Date | null;
  lastLoginIp: string | null;
  passwordChangedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    passwordHash: { type: String, required: true, select: false },
    role: { type: Schema.Types.ObjectId, ref: 'Role', required: true },
    status: { type: String, enum: ['active', 'disabled'], default: 'active' },
    failedLogins: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
    lastLoginIp: { type: String, default: null },
    passwordChangedAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true, collection: 'users' },
);

export const User = model<IUser>('User', UserSchema);
