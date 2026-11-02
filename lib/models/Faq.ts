// =============================================================================
// FILE: lib/models/Faq.ts
// Mongoose model for FAQs
// =============================================================================

import mongoose, { Schema, Document } from 'mongoose';

export interface IFaq extends Document {
  question: string;
  answer: string;
  order: number;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FaqSchema = new Schema<IFaq>({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  order: { type: Number, default: 0 },
  published: { type: Boolean, default: true }
}, {
  timestamps: true,
  collection: 'faqs'
});

FaqSchema.index({ published: 1, order: 1 });

export const Faq = mongoose.models.Faq || mongoose.model<IFaq>('Faq', FaqSchema);
