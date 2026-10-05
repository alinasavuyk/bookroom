import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Message from '@/models/Message';
import { isNonEmpty } from '@/lib/validation';

const BOOK_REF_FIELDS = 'title coverImage price';

// GET /api/messages?with=<userId> — історія переписки з конкретним користувачем (лише свої)
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Потрібно увійти в акаунт' }, { status: 401 });
  }

  await connectDB();
  const { searchParams } = new URL(request.url);
  const withUserId = searchParams.get('with');
  if (!withUserId) {
    return NextResponse.json({ error: 'Не вказано співрозмовника' }, { status: 400 });
  }

  const meId = session.user.id;

  const messages = await Message.find({
    $or: [
      { sender: meId, receiver: withUserId },
      { sender: withUserId, receiver: meId },
    ],
  })
    .sort({ createdAt: 1 })
    .populate('book', BOOK_REF_FIELDS)
    .populate('offeredBook', BOOK_REF_FIELDS);

  // Позначаємо прочитаними ті, що написав співрозмовник мені
  await Message.updateMany({ sender: withUserId, receiver: meId, read: false }, { $set: { read: true } });

  return NextResponse.json(messages);
}

// POST /api/messages — надіслати нове повідомлення, або пропозицію обміну,
// якщо передано offeredBook (лише для залогінених)
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Потрібно увійти в акаунт' }, { status: 401 });
  }

  await connectDB();
  const data = await request.json();

  if (!data.receiver || !isNonEmpty(data.text)) {
    return NextResponse.json({ error: 'Заповни текст повідомлення' }, { status: 400 });
  }

  const message = await Message.create({
    sender: session.user.id,
    receiver: data.receiver,
    book: data.book || undefined,
    offeredBook: data.offeredBook || undefined,
    offerStatus: data.offeredBook ? 'pending' : undefined,
    text: data.text,
  });

  await message.populate('book', BOOK_REF_FIELDS);
  await message.populate('offeredBook', BOOK_REF_FIELDS);

  return NextResponse.json(message, { status: 201 });
}
