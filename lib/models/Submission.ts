// =============================================================================
// FILE: lib/models/Submission.ts — form responses / event registrations
// =============================================================================
import { Schema, type Types } from 'mongoose';
import { model } from './_util';

export interface ISubmission {
  _id: Types.ObjectId;
  form: Types.ObjectId;
  event: Types.ObjectId | null;
  data: Record<string, string | string[] | boolean>;
  email: string;      // normalised, '' if the form has no email field
  ipHash: string;     // salted hash — enough to spot abuse, not to identify people
  userAgent: string;
  status: 'new' | 'confirmed' | 'waitlist' | 'cancelled';
  createdAt: Date;
}

const SubmissionSchema = new Schema<ISubmission>(
  {
    form: { type: Schema.Types.ObjectId, ref: 'Form', required: true, index: true },
    event: { type: Schema.Types.ObjectId, ref: 'Event', default: null, index: true },
    data: { type: Schema.Types.Mixed, default: {} },
    email: { type: String, default: '', lowercase: true },
    ipHash: { type: String, default: '' },
    userAgent: { type: String, default: '', maxlength: 300 },
    status: { type: String, enum: ['new', 'confirmed', 'waitlist', 'cancelled'], default: 'new' },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'submissions' },
);
SubmissionSchema.index({ form: 1, email: 1 });
SubmissionSchema.index({ createdAt: -1 });

export const Submission = model<ISubmission>('Submission', SubmissionSchema);
