// =============================================================================
// FILE: lib/models/Program.ts
// Mongoose model for programs
// =============================================================================

import mongoose, { Schema, Document } from 'mongoose';

export enum ProgramStatus {
  OPEN = 'OPEN',
  COMING_SOON = 'COMING_SOON',
  ALWAYS_ON = 'ALWAYS_ON'
}

export enum ProgramArt {
  TERMINAL = 'TERMINAL',
  LAB = 'LAB',
  MIC = 'MIC',
  BADGE = 'BADGE',
  SHIELD = 'SHIELD'
}

export interface IProgram extends Document {
  title: string;
  level: string;
  status: ProgramStatus;
  description: string;
  meta: string[];
  ctaLabel: string;
  ctaHref: string;
  art: ProgramArt;
  featured: boolean;
  order: number;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProgramSchema = new Schema<IProgram>({
  title: { type: String, required: true },
  level: { type: String, required: true },
  status: { 
    type: String, 
    enum: Object.values(ProgramStatus), 
    default: ProgramStatus.OPEN 
  },
  description: { type: String, required: true },
  meta: { type: [String], required: true },
  ctaLabel: { type: String, required: true },
  ctaHref: { type: String, required: true },
  art: { 
    type: String, 
    enum: Object.values(ProgramArt), 
    default: ProgramArt.TERMINAL 
  },
  featured: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
  published: { type: Boolean, default: true },
}, {
  timestamps: true,
  collection: 'programs'
});

ProgramSchema.index({ published: 1, order: 1 });

export const Program = mongoose.models.Program || mongoose.model<IProgram>('Program', ProgramSchema);
