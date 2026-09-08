import mongoose, { Schema, Model } from 'mongoose';

export interface IBook {
  title: string;
  author: string;
  description: string;
  genres: string[];
  coverImage: string;
  price: number;
  type: 'sale' | 'exchange' | 'both';
  status: 'available' | 'reserved' | 'sold';
  owner: mongoose.Types.ObjectId;
}

const BookSchema = new Schema<IBook>(
  {
    title: { type: String, required: true },
    author: { type: String, required: true },
    description: { type: String, default: '' },
    genres: { type: [String], default: [] },
    coverImage: { type: String, default: '' },
    price: { type: Number, default: 0 }, // 0 = тільки обмін
    type: { type: String, enum: ['sale', 'exchange', 'both'], default: 'sale' },
    status: { type: String, enum: ['available', 'reserved', 'sold'], default: 'available' },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export default (mongoose.models.Book as Model<IBook>) || mongoose.model<IBook>('Book', BookSchema);
