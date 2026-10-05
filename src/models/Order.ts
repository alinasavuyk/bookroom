import mongoose, { Schema, Model } from 'mongoose';

export interface IOrder {
  book: mongoose.Types.ObjectId;
  bookTitle: string;
  bookCoverImage: string;
  price: number;
  buyer: mongoose.Types.ObjectId;
  seller: mongoose.Types.ObjectId;
  city: string;
  warehouse: string;
  paymentMethod: 'cash' | 'card' | 'cod';
  status: 'active' | 'confirmed' | 'cancelled';
}

const OrderSchema = new Schema<IOrder>(
  {
    book: { type: Schema.Types.ObjectId, ref: 'Book', required: true },
    // Знімок назви й обкладинки на момент замовлення — щоб історія не ламалась,
    // якщо книгу згодом відредагують чи видалять
    bookTitle: { type: String, required: true },
    bookCoverImage: { type: String, default: '' },
    price: { type: Number, required: true },
    buyer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    seller: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    city: { type: String, required: true },
    warehouse: { type: String, required: true },
    paymentMethod: { type: String, enum: ['cash', 'card', 'cod'], required: true },
    status: { type: String, enum: ['active', 'confirmed', 'cancelled'], default: 'active' },
  },
  { timestamps: true }
);

export default (mongoose.models.Order as Model<IOrder>) || mongoose.model<IOrder>('Order', OrderSchema);
