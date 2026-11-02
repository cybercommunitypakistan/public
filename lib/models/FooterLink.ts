// =============================================================================
// FILE: lib/models/FooterLink.ts
// Mongoose model for footer links
// =============================================================================

import mongoose, { Schema, Document } from 'mongoose';

export interface IFooterLink extends Document {
  label: string;
  href: string;
  order: number;
  visible: boolean;
  updatedAt: Date;
}

const FooterLinkSchema = new Schema<IFooterLink>({
  label: { type: String, required: true },
  href: { type: String, required: true },
  order: { type: Number, default: 0 },
  visible: { type: Boolean, default: true },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: false, updatedAt: true },
  collection: 'footer_links'
});

export const FooterLink = mongoose.models.FooterLink || mongoose.model<IFooterLink>('FooterLink', FooterLinkSchema);
