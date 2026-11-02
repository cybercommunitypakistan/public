// =============================================================================
// FILE: lib/models/Page.ts
// Pages built in the admin panel. Each page is a list of blocks rendered by
// components/blocks/BlockRenderer.tsx at /<slug>. `system` pages (home, about,
// blog, events) are code routes: only their status/menu entry is stored here,
// so they can be disabled from the panel.
// =============================================================================
import { Schema, type Types } from 'mongoose';
import { model } from './_util';

export type PageStatus = 'published' | 'draft' | 'disabled';

export interface IBlock {
  id: string;
  type: string;
  data: Record<string, unknown>;
}

export interface IPage {
  _id: Types.ObjectId;
  slug: string;          // '' = home, 'about', 'join/ambassadors'
  title: string;
  description: string;   // meta description
  status: PageStatus;
  system: boolean;
  showInMenu: boolean;
  menuLabel: string;
  order: number;
  blocks: IBlock[];
  ogImage: string | null;
  updatedBy: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const BlockSchema = new Schema<IBlock>(
  { id: { type: String, required: true }, type: { type: String, required: true }, data: { type: Schema.Types.Mixed, default: {} } },
  { _id: false },
);

const PageSchema = new Schema<IPage>(
  {
    slug: { type: String, default: '', trim: true, lowercase: true, maxlength: 120 },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    description: { type: String, default: '', maxlength: 300 },
    status: { type: String, enum: ['published', 'draft', 'disabled'], default: 'draft' },
    system: { type: Boolean, default: false },
    showInMenu: { type: Boolean, default: false },
    menuLabel: { type: String, default: '', maxlength: 40 },
    order: { type: Number, default: 100 },
    blocks: { type: [BlockSchema], default: [] },
    ogImage: { type: String, default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true, collection: 'pages' },
);
PageSchema.index({ slug: 1 }, { unique: true });

export const Page = model<IPage>('Page', PageSchema);
