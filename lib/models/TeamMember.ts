// =============================================================================
// FILE: lib/models/TeamMember.ts
// Mongoose model for team members
// =============================================================================

import mongoose, { Schema, Document } from 'mongoose';

export enum TeamGroup {
  CORE = 'CORE',
  LEADS = 'LEADS',
  ADVISORS = 'ADVISORS'
}

export interface ITeamMember extends Document {
  name: string;
  role: string;
  group: TeamGroup;
  city?: string | null;
  photoUrl?: string | null;
  photoPublicId?: string | null;
  linkedin?: string | null;
  x?: string | null;
  github?: string | null;
  email?: string | null;
  order: number;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TeamMemberSchema = new Schema<ITeamMember>({
  name: { type: String, required: true },
  role: { type: String, required: true },
  group: { 
    type: String, 
    enum: Object.values(TeamGroup), 
    default: TeamGroup.CORE 
  },
  city: { type: String, default: null },
  photoUrl: { type: String, default: null },
  photoPublicId: { type: String, default: null },
  linkedin: { type: String, default: null },
  x: { type: String, default: null },
  github: { type: String, default: null },
  email: { type: String, default: null },
  order: { type: Number, default: 0 },
  published: { type: Boolean, default: true }
}, {
  timestamps: true,
  collection: 'team_members'
});

TeamMemberSchema.index({ published: 1, order: 1 });

export const TeamMember = mongoose.models.TeamMember || mongoose.model<ITeamMember>('TeamMember', TeamMemberSchema);
