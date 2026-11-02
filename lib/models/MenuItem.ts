// =============================================================================
// FILE: lib/models/MenuItem.ts
// Mongoose model for navigation menu items
// =============================================================================

import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMenuItem extends Document {
  _id: Types.ObjectId;
  label: string;
  href?: string | null;
  description?: string | null;
  badge?: string | null;
  order: number;
  visible: boolean;
  parentId?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const MenuItemSchema = new Schema<IMenuItem>({
  label: { type: String, required: true },
  href: { type: String, default: null },
  description: { type: String, default: null },
  badge: { type: String, default: null },
  order: { type: Number, default: 0 },
  visible: { type: Boolean, default: true },
  parentId: { type: Schema.Types.ObjectId, ref: 'MenuItem', default: null }
}, {
  timestamps: true,
  collection: 'menu_items'
});

MenuItemSchema.index({ parentId: 1, order: 1 });

export const MenuItem = mongoose.models.MenuItem || mongoose.model<IMenuItem>('MenuItem', MenuItemSchema);
