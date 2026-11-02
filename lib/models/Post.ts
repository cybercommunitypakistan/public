// =============================================================================
// FILE: lib/models/Post.ts — blog posts (Markdown body, rendered safely)
// =============================================================================
import { Schema, type Types } from 'mongoose';
import { model } from './_util';

export type PostStatus = 'draft' | 'review' | 'published';

export interface IPost {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  excerpt: string;
  content: string; // Markdown
  coverUrl: string | null;
  coverAlt: string;
  tags: string[];
  author: Types.ObjectId;
  status: PostStatus;
  publishedAt: Date | null; // a future date = scheduled
  featured: boolean;
  readingMinutes: number;
  seoTitle: string;
  seoDescription: string;
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema = new Schema<IPost>(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 160 },
    excerpt: { type: String, default: '', maxlength: 400 },
    content: { type: String, default: '', maxlength: 200_000 },
    coverUrl: { type: String, default: null },
    coverAlt: { type: String, default: '', maxlength: 200 },
    tags: { type: [String], default: [] },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['draft', 'review', 'published'], default: 'draft' },
    publishedAt: { type: Date, default: null },
    featured: { type: Boolean, default: false },
    readingMinutes: { type: Number, default: 1 },
    seoTitle: { type: String, default: '', maxlength: 160 },
    seoDescription: { type: String, default: '', maxlength: 300 },
  },
  { timestamps: true, collection: 'posts' },
);
PostSchema.index({ status: 1, publishedAt: -1 });
PostSchema.index({ tags: 1 });

export const Post = model<IPost>('Post', PostSchema);
