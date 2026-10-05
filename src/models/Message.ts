import mongoose, { Schema, Model } from 'mongoose';

export interface IMessage {
  sender: mongoose.Types.ObjectId;
  receiver: mongoose.Types.ObjectId;
  book?: mongoose.Types.ObjectId; // про яку книгу йде мова (запитувана книга)
  offeredBook?: mongoose.Types.ObjectId; // книга, яку пропонують натомість — якщо це пропозиція обміну
  offerStatus?: 'pending' | 'accepted' | 'declined';
  text: string;
  read: boolean;
}

const MessageSchema = new Schema<IMessage>(
  {
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    book: { type: Schema.Types.ObjectId, ref: 'Book' },
    offeredBook: { type: Schema.Types.ObjectId, ref: 'Book' },
    offerStatus: { type: String, enum: ['pending', 'accepted', 'declined'] },
    text: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default (mongoose.models.Message as Model<IMessage>) || mongoose.model<IMessage>('Message', MessageSchema);
