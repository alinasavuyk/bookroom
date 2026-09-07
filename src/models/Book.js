import mongoose from 'mongoose';

const BookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    author: { type: String, required: true },
    description: { type: String, default: '' },
    genre: { type: String, default: 'Інше' },
    coverImage: { type: String, default: '' },
    price: { type: Number, default: 0 }, // 0 = тільки обмін
    type: { type: String, enum: ['sale', 'exchange', 'both'], default: 'sale' },
    status: { type: String, enum: ['available', 'reserved', 'sold'], default: 'available' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Book || mongoose.model('Book', BookSchema);
