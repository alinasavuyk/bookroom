import mongoose, { Schema, Model } from 'mongoose';

export interface IRateLimit {
  key: string;
  count: number;
  expiresAt: Date;
}

// TTL-індекс (expires: 0) сам прибирає документ, щойно спливає expiresAt —
// колекція не росте нескінченно і не потребує ручного очищення
const RateLimitSchema = new Schema<IRateLimit>({
  key: { type: String, required: true, unique: true },
  count: { type: Number, required: true, default: 1 },
  expiresAt: { type: Date, required: true, expires: 0 },
});

export default (mongoose.models.RateLimit as Model<IRateLimit>) ||
  mongoose.model<IRateLimit>('RateLimit', RateLimitSchema);
