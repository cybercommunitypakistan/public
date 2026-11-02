// =============================================================================
// FILE: lib/models/SocialLink.ts
// Mongoose model for social media links
// =============================================================================

import mongoose, { Schema, Document } from 'mongoose';

export interface ISocialLink extends Document {
  label: string;
  href: string;
  order: number;
  visible: boolean;
  updatedAt: Date;
}

const SocialLinkSchema = new Schema<ISocialLink>({
  label: { type: String, required: true },
  href: { type: String, required: true },
  order: { type: Number, default: 0 },
  visible: { type: Boolean, default: true },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: false, updatedAt: true },
  collection: 'social_links'
});

export const SocialLink = mongoose.models.SocialLink || mongoose.model<ISocialLink>('SocialLink', SocialLinkSchema);
