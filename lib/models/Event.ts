// =============================================================================
// FILE: lib/models/Event.ts
// Mongoose model for events
// =============================================================================

import mongoose, { Schema, Document } from 'mongoose';

export enum EventType {
  LECTURE = 'LECTURE',
  WORKSHOP = 'WORKSHOP',
  WEBINAR = 'WEBINAR',
  MEETUP = 'MEETUP'
}

export interface IEvent extends Document {
  date: Date;
  title: string;
  type: EventType;
  series?: string | null;
  format: string;
  description: string;
  href: string;
  published: boolean;
  // ---- event system (admin panel) ----
  slug?: string | null;
  endDate?: Date | null;
  startTime?: string;      // '18:30' (Pakistan time)
  endTime?: string;
  location?: string;       // venue or 'Online'
  onlineUrl?: string;      // shown only to registrants (email)
  coverUrl?: string | null;
  body?: string;           // Markdown details
  capacity?: number;       // 0 = unlimited
  registration?: 'none' | 'form' | 'external';
  form?: mongoose.Types.ObjectId | null;
  registrationClosesAt?: Date | null;
  waitlist?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>({
  date: { type: Date, required: true },
  title: { type: String, required: true },
  type: { 
    type: String, 
    enum: Object.values(EventType), 
    default: EventType.LECTURE 
  },
  series: { type: String, default: null },
  format: { type: String, required: true },
  description: { type: String, required: true },
  href: { type: String, default: '' },
  published: { type: Boolean, default: true },
  slug: { type: String, default: null, lowercase: true, trim: true },
  endDate: { type: Date, default: null },
  startTime: { type: String, default: '' },
  endTime: { type: String, default: '' },
  location: { type: String, default: '' },
  onlineUrl: { type: String, default: '' },
  coverUrl: { type: String, default: null },
  body: { type: String, default: '' },
  capacity: { type: Number, default: 0 },
  registration: { type: String, enum: ['none', 'form', 'external'], default: 'external' },
  form: { type: Schema.Types.ObjectId, ref: 'Form', default: null },
  registrationClosesAt: { type: Date, default: null },
  waitlist: { type: Boolean, default: false }
}, {
  timestamps: true,
  collection: 'events'
});

EventSchema.index({ published: 1, date: 1 });
EventSchema.index({ slug: 1 }, { unique: true, partialFilterExpression: { slug: { $type: 'string' } } });

export const Event = mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema);
