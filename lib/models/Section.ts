// =============================================================================
// FILE: lib/models/Section.ts
// Mongoose model for section content (JSON storage)
// =============================================================================

import mongoose, { Schema, Document } from 'mongoose';

export interface ISection extends Document {
  key: string;
  content: Record<string, any>;
  updatedAt: Date;
}

const SectionSchema = new Schema<ISection>({
  key: { type: String, required: true, unique: true },
  content: { type: Schema.Types.Mixed, required: true },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: false, updatedAt: true },
  collection: 'sections'
});

export const Section = mongoose.models.Section || mongoose.model<ISection>('Section', SectionSchema);
