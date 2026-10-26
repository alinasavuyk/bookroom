import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuth } from '@/lib/apiAuth';
import { parseBody } from '@/lib/apiValidation';
import { sendMessageSchema } from '@/lib/apiSchemas';
import Message from '@/models/Message';
import User from '@/models/User';
import { createMessageAndNotify } from '@/lib/notifications';

const BOOK_REF_FIELDS = 'title coverImage price';

// GET /api/messages?with=<userId> — історія переписки з конкретним користувачем (лише свої)
export async function GET(request: Request) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const meId = auth.userId;

  await connectDB();
  const { searchParams } = new URL(request.url);
  const withUserId = searchParams.get('with');
  if (!withUserId) {
    return NextResponse.json({ error: 'Не вказано співрозмовника' }, { status: 400 });
  }

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
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const meId = auth.userId;

  await connectDB();
  const body = await parseBody(request, sendMessageSchema);
  if (body.error) return body.error;
  const data = body.data;

  const [me, receiver] = await Promise.all([
    User.findById(meId).select('blockedUsers'),
    User.findById(data.receiver).select('blockedUsers'),
  ]);
  const isBlocked =
    me?.blockedUsers.some((u) => u.toString() === data.receiver) ||
    receiver?.blockedUsers.some((u) => u.toString() === meId);
  if (isBlocked) {
    return NextResponse.json({ error: 'Неможливо надіслати повідомлення цьому користувачу' }, { status: 403 });
  }

  const message = await createMessageAndNotify({
    sender: meId,
    receiver: data.receiver,
    book: data.book || undefined,
    offeredBook: data.offeredBook || undefined,
    offerStatus: data.offeredBook ? 'pending' : undefined,
    offererCity: data.offeredBook ? data.offererCity : undefined,
    offererWarehouse: data.offeredBook ? data.offererWarehouse : undefined,
    text: data.text || '',
    image: data.image || undefined,
  });

  await message.populate('book', BOOK_REF_FIELDS);
  await message.populate('offeredBook', BOOK_REF_FIELDS);

  return NextResponse.json(message, { status: 201 });
}
