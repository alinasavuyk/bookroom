import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String }, // немає, якщо вхід через соцмережу
    avatar: { type: String, default: '' },
    provider: { type: String, enum: ['credentials', 'google'], default: 'credentials' },
    books: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Book' }],
    rating: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model('User', UserSchema);
