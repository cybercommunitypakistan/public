// =============================================================================
// FILE: lib/models/Form.ts
// Google-Forms-style forms built in the admin panel. Used on their own
// (/forms/<slug>), inside a page block, or as an event's registration form.
// =============================================================================
import { Schema, type Types } from 'mongoose';
import { model } from './_util';

export const FIELD_TYPES = [
  'short_text', 'long_text', 'email', 'phone', 'number', 'url', 'date', 'time',
  'select', 'radio', 'checkbox', 'consent', 'heading',
] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

export interface IFormField {
  id: string;
  type: FieldType;
  label: string;
  help: string;
  placeholder: string;
  required: boolean;
  options: string[];   // select / radio / checkbox
  min: number | null;  // text: min length · number: min value
  max: number | null;  // text: max length · number: max value
  width: 'full' | 'half';
}

export interface IForm {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  fields: IFormField[];
  status: 'open' | 'closed';
  successMessage: string;
  submitLabel: string;
  /** one submission per email address (needs an email field) */
  uniqueEmail: boolean;
  /** stop accepting after this many submissions (0 = unlimited) */
  limit: number;
  closesAt: Date | null;
  notifyEmail: string;
  createdBy: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const FieldSchema = new Schema<IFormField>(
  {
    id: { type: String, required: true },
    type: { type: String, enum: FIELD_TYPES, required: true },
    label: { type: String, required: true, maxlength: 200 },
    help: { type: String, default: '', maxlength: 400 },
    placeholder: { type: String, default: '', maxlength: 120 },
    required: { type: Boolean, default: false },
    options: { type: [String], default: [] },
    min: { type: Number, default: null },
    max: { type: Number, default: null },
    width: { type: String, enum: ['full', 'half'], default: 'full' },
  },
  { _id: false },
);

const FormSchema = new Schema<IForm>(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 120 },
    description: { type: String, default: '', maxlength: 2000 },
    fields: { type: [FieldSchema], default: [] },
    status: { type: String, enum: ['open', 'closed'], default: 'open' },
    successMessage: { type: String, default: 'Thanks — your response has been recorded.', maxlength: 500 },
    submitLabel: { type: String, default: 'Submit', maxlength: 40 },
    uniqueEmail: { type: Boolean, default: false },
    limit: { type: Number, default: 0 },
    closesAt: { type: Date, default: null },
    notifyEmail: { type: String, default: '', maxlength: 254 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true, collection: 'forms' },
);

export const Form = model<IForm>('Form', FormSchema);
