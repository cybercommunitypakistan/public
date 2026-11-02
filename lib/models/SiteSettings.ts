// =============================================================================
// FILE: lib/models/SiteSettings.ts
// Mongoose model for global site settings
// =============================================================================

import mongoose, { Schema, Document } from 'mongoose';

export interface ISiteSettings extends Document {
  name: string;
  shortName: string;
  email: string;
  applyUrl: string;
  logoUrl?: string | null;
  logoPublicId?: string | null;
  logoAlt?: string | null;
  logoWidth?: number | null;
  logoHeight?: number | null;
  logoDisplayHeight: number;
  logoBlend: boolean;
  faviconUrl?: string | null;
  /** colour scheme: a preset id or 'custom' + the token values */
  theme: { preset: string; colors: Record<string, string> };
  /** honeypot + registration security switches */
  security: { blockAfterHoneypotHits: number; minFormSeconds: number };
  updatedAt: Date;
}

const SiteSettingsSchema = new Schema<ISiteSettings>({
  name: { type: String, required: true },
  shortName: { type: String, required: true },
  email: { type: String, required: true },
  applyUrl: { type: String, required: true },
  logoUrl: { type: String, default: null },
  logoPublicId: { type: String, default: null },
  logoAlt: { type: String, default: null },
  logoWidth: { type: Number, default: null },
  logoHeight: { type: Number, default: null },
  logoDisplayHeight: { type: Number, default: 34 },
  logoBlend: { type: Boolean, default: true },
  faviconUrl: { type: String, default: null },
  theme: {
    preset: { type: String, default: 'midnight-emerald' },
    colors: { type: Schema.Types.Mixed, default: {} }
  },
  security: {
    blockAfterHoneypotHits: { type: Number, default: 2 },
    minFormSeconds: { type: Number, default: 3 }
  },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: false, updatedAt: true },
  collection: 'site_settings'
});

export const SiteSettings = mongoose.models.SiteSettings || mongoose.model<ISiteSettings>('SiteSettings', SiteSettingsSchema);
