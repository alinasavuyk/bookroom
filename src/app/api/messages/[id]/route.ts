import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Message from '@/models/Message';
import Book from '@/models/Book';

const BOOK_REF_FIELDS = 'title coverImage price';

// PATCH /api/messages/:id — прийняти чи відхилити пропозицію обміну —
// лише отримувач пропозиції
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Потрібно увійти в акаунт' }, { status: 401 });
  }

  const { id } = await params;
  const { action } = await request.json();
  if (action !== 'accept' && action !== 'decline') {
    return NextResponse.json({ error: 'Невідома дія' }, { status: 400 });
  }

  await connectDB();
  const message = await Message.findById(id);
  if (!message) return NextResponse.json({ error: 'Повідомлення не знайдено' }, { status: 404 });

  if (message.receiver.toString() !== session.user.id) {
    return NextResponse.json({ error: 'Немає доступу до цієї пропозиції' }, { status: 403 });
  }
  if (!message.offeredBook || message.offerStatus !== 'pending') {
    return NextResponse.json({ error: 'Цю пропозицію вже опрацьовано' }, { status: 400 });
  }

  message.offerStatus = action === 'accept' ? 'accepted' : 'declined';
  await message.save();

  if (action === 'accept') {
    await Book.updateMany(
      { _id: { $in: [message.book, message.offeredBook] } },
      { $set: { status: 'reserved' } }
    );
  }

  await Message.create({
    sender: session.user.id,
    receiver: message.sender,
    book: message.book,
    offeredBook: message.offeredBook,
    text:
      action === 'accept'
        ? 'Пропозицію обміну прийнято! Напишіть, будь ласка, як домовитись про передачу книг.'
        : 'Пропозицію обміну відхилено.',
  });

  await message.populate('book', BOOK_REF_FIELDS);
  await message.populate('offeredBook', BOOK_REF_FIELDS);

  return NextResponse.json(message);
}
