// =============================================================================
// FILE: lib/models/_util.ts
// Helper so every model is registered once (Next hot reload) and keeps its type.
// =============================================================================
import mongoose, { type Model, type Schema } from 'mongoose';

export function model<T>(name: string, schema: Schema<T>): Model<T> {
  return (mongoose.models[name] as Model<T>) || mongoose.model<T>(name, schema);
}
