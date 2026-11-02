// =============================================================================
// FILE: lib/models/Testimonial.ts
// Mongoose model for testimonials
// =============================================================================

import mongoose, { Schema, Document } from 'mongoose';

export interface ITestimonial extends Document {
  quote: string;
  name: string;
  role: string;
  avatarUrl?: string | null;
  isSample: boolean;
  order: number;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TestimonialSchema = new Schema<ITestimonial>({
  quote: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, required: true },
  avatarUrl: { type: String, default: null },
  isSample: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
  published: { type: Boolean, default: true }
}, {
  timestamps: true,
  collection: 'testimonials'
});

TestimonialSchema.index({ published: 1, order: 1 });

export const Testimonial = mongoose.models.Testimonial || mongoose.model<ITestimonial>('Testimonial', TestimonialSchema);
