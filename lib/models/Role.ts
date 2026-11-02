// =============================================================================
// FILE: lib/models/Role.ts
// Roles hold a list of permission keys (lib/auth/permissions.ts).
// `system` roles (Owner) can't be deleted or stripped of permissions.
// =============================================================================
import { Schema, type Types } from 'mongoose';
import { model } from './_util';

export interface IRole {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  permissions: string[];
  system: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RoleSchema = new Schema<IRole>(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 60 },
    description: { type: String, default: '', maxlength: 240 },
    permissions: { type: [String], default: [] },
    system: { type: Boolean, default: false },
  },
  { timestamps: true, collection: 'roles' },
);

export const Role = model<IRole>('Role', RoleSchema);
