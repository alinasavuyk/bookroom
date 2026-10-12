import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Message from '@/models/Message';

const BOOK_REF_FIELDS = 'title coverImage price';

// GET /api/exchanges — усі мої пропозиції обміну (і ті, що я пропонував,
// і ті, що пропонували мені), незалежно від конкретної розмови
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Потрібно увійти в акаунт' }, { status: 401 });
  }

  await connectDB();
  const meId = session.user.id;

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
