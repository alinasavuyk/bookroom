import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuth } from '@/lib/apiAuth';
import Message from '@/models/Message';

const BOOK_REF_FIELDS = 'title coverImage price';

// GET /api/exchanges — усі мої пропозиції обміну (і ті, що я пропонував,
// і ті, що пропонували мені), незалежно від конкретної розмови
export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const meId = auth.userId;

  await connectDB();

  // Лише первинні повідомлення-пропозиції мають offerStatus — наступні
  // службові повідомлення (прийнято/відхилено/дані доставки) його не мають
  const exchanges = await Message.find({
    offerStatus: { $exists: true },
    $or: [{ sender: meId }, { receiver: meId }],
  })
    .sort({ createdAt: -1 })
    .populate('sender', 'name avatar')
    .populate('receiver', 'name avatar')
    .populate('book', BOOK_REF_FIELDS)
    .populate('offeredBook', BOOK_REF_FIELDS);

  return NextResponse.json(exchanges);
}
