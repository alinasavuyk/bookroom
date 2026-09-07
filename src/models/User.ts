import mongoose, { Schema, Model } from 'mongoose';

export interface IUser {
  name: string;
  email: string;
  password?: string;
  avatar: string;
  bio: string;
  provider: 'credentials' | 'google';
  savedBooks: mongoose.Types.ObjectId[];
  rating: number;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String }, // немає, якщо вхід через соцмережу
    avatar: { type: String, default: '' },
    bio: { type: String, default: '' },
    provider: { type: String, enum: ['credentials', 'google'], default: 'credentials' },
    savedBooks: [{ type: Schema.Types.ObjectId, ref: 'Book' }],
    rating: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>('User', UserSchema);
