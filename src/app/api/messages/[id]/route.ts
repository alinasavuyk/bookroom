import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Message from '@/models/Message';
import Book from '@/models/Book';
import { createMessageAndNotify } from '@/lib/notifications';

const BOOK_REF_FIELDS = 'title coverImage price';

// PATCH /api/messages/:id — прийняти (з власними даними доставки) чи
// відхилити пропозицію обміну (лише отримувач), або скасувати її
// (будь-яка зі сторін, поки обмін ще не завершено)
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Потрібно увійти в акаунт' }, { status: 401 });
  }

  const { id } = await params;
  const { action, city, warehouse } = await request.json();
  if (action !== 'accept' && action !== 'decline' && action !== 'cancel') {
    return NextResponse.json({ error: 'Невідома дія' }, { status: 400 });
  }

  await connectDB();
  const message = await Message.findById(id);
  if (!message) return NextResponse.json({ error: 'Повідомлення не знайдено' }, { status: 404 });
  if (!message.offeredBook) {
    return NextResponse.json({ error: 'Це не пропозиція обміну' }, { status: 400 });
  }

  const meId = session.user.id;
  const isSender = message.sender.toString() === meId;
  const isReceiver = message.receiver.toString() === meId;

  if (action === 'cancel') {
    if (!isSender && !isReceiver) {
      return NextResponse.json({ error: 'Немає доступу до цієї пропозиції' }, { status: 403 });
    }
    if (message.offerStatus !== 'pending' && message.offerStatus !== 'accepted') {
      return NextResponse.json({ error: 'Цю пропозицію вже опрацьовано' }, { status: 400 });
    }

    const wasAccepted = message.offerStatus === 'accepted';
    message.offerStatus = 'cancelled';
    await message.save();

    if (wasAccepted) {
      await Book.updateMany(
        { _id: { $in: [message.book, message.offeredBook] } },
        { $set: { status: 'available' } }
      );
    }

    await createMessageAndNotify({
      sender: meId,
      receiver: isSender ? message.receiver : message.sender,
      book: message.book,
      offeredBook: message.offeredBook,
      text: 'Обмін скасовано.',
    });

    await message.populate('book', BOOK_REF_FIELDS);
    await message.populate('offeredBook', BOOK_REF_FIELDS);
    return NextResponse.json(message);
  }

  // accept / decline — лише отримувач пропозиції
  if (!isReceiver) {
    return NextResponse.json({ error: 'Немає доступу до цієї пропозиції' }, { status: 403 });
  }
  if (message.offerStatus !== 'pending') {
    return NextResponse.json({ error: 'Цю пропозицію вже опрацьовано' }, { status: 400 });
  }

  if (action === 'accept') {
    if (!city || !warehouse) {
      return NextResponse.json({ error: 'Вкажи місто й відділення для доставки' }, { status: 400 });
    }

    message.offerStatus = 'accepted';
    message.ownerCity = city;
    message.ownerWarehouse = warehouse;
    await message.save();

    await Book.updateMany(
      { _id: { $in: [message.book, message.offeredBook] } },
      { $set: { status: 'reserved' } }
    );

    await createMessageAndNotify({
      sender: meId,
      receiver: message.sender,
      book: message.book,
      offeredBook: message.offeredBook,
      text: 'Пропозицію обміну прийнято! Дані доставки обох сторін заповнено — можна домовлятись про відправлення.',
    });
  } else {
    message.offerStatus = 'declined';
    await message.save();

    await createMessageAndNotify({
      sender: meId,
      receiver: message.sender,
      book: message.book,
      offeredBook: message.offeredBook,
      text: 'Пропозицію обміну відхилено.',
    });
  }

  await message.populate('book', BOOK_REF_FIELDS);
  await message.populate('offeredBook', BOOK_REF_FIELDS);

  return NextResponse.json(message);
}
