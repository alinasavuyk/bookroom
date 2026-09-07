import mongoose, { Schema, Model } from 'mongoose';

export interface IComment {
  text: string;
  author: mongoose.Types.ObjectId;
  book: mongoose.Types.ObjectId;
  rating?: number;
}

const CommentSchema = new Schema<IComment>(
  {
    text: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    book: { type: Schema.Types.ObjectId, ref: 'Book', required: true },
    rating: { type: Number, min: 1, max: 5 },
  },
  { timestamps: true }
);

export default (mongoose.models.Comment as Model<IComment>) || mongoose.model<IComment>('Comment', CommentSchema);
