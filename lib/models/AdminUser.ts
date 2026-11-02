// =============================================================================
// FILE: lib/models/AdminUser.ts
// Mongoose model for admin users
// =============================================================================

import mongoose, { Schema, Document } from 'mongoose';

export enum AdminRole {
  OWNER = 'OWNER',
  EDITOR = 'EDITOR'
}

export interface IAdminUser extends Document {
  email: string;
  name?: string | null;
  role: AdminRole;
  createdAt: Date;
  updatedAt: Date;
}

const AdminUserSchema = new Schema<IAdminUser>({
  email: { type: String, required: true, unique: true },
  name: { type: String, default: null },
  role: { 
    type: String, 
    enum: Object.values(AdminRole), 
    default: AdminRole.EDITOR 
  }
}, {
  timestamps: true,
  collection: 'admin_users'
});

export const AdminUser = mongoose.models.AdminUser || mongoose.model<IAdminUser>('AdminUser', AdminUserSchema);
