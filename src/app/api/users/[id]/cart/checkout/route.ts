import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireSelf } from '@/lib/apiAuth';
import { parseBody } from '@/lib/apiValidation';
import { checkoutSchema } from '@/lib/apiSchemas';
import User from '@/models/User';
import Book from '@/models/Book';
import Order from '@/models/Order';
import { createMessageAndNotify } from '@/lib/notifications';

const PAYMENT_LABEL: Record<string, string> = {
  cash: 'Готівкою при отриманні',
  card: 'Переказ на карту',
  cod: 'Накладений платіж',
};

// POST /api/users/:id/cart/checkout — оформити всі книги з кошика: позначити
// їх зарезервованими і надіслати власникам автоматичне повідомлення
// з даними доставки (лише собі)
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireSelf(id);
  if (auth.error) return auth.error;

  const body = await parseBody(request, checkoutSchema);
  if (body.error) return body.error;
  const { city, warehouse, paymentMethod } = body.data;

  await connectDB();
  const user = await User.findById(id);
  if (!user) return NextResponse.json({ error: 'Користувача не знайдено' }, { status: 404 });

  const cartBooks = await Book.find({ _id: { $in: user.cart } });

  const deliveryLine = `Доставка: Нова Пошта, ${city}, відділення ${warehouse}. Оплата: ${PAYMENT_LABEL[paymentMethod]}.`;

  const ordered: string[] = [];
  const unavailable: string[] = [];

  for (const book of cartBooks) {
    if (book.status !== 'available' || book.price <= 0) {
      unavailable.push(book.title);
      continue;
    }

    book.status = 'reserved';
    await book.save();

    await createMessageAndNotify({
      sender: id,
      receiver: book.owner,
      book: book._id,
      text: `Хочу купити книгу «${book.title}» за ${book.price} ₴. ${deliveryLine} Напишіть, будь ласка, як домовитись про передачу.`,
    });

    await Order.create({
      book: book._id,
      bookTitle: book.title,
      bookAuthor: book.author,
      bookCoverImage: book.coverImage,
      price: book.price,
      buyer: id,
      seller: book.owner,
      city,
      warehouse,
      paymentMethod,
    });

    ordered.push(book.title);
  }

  user.cart = [];
  await user.save();

  return NextResponse.json({ ordered, unavailable });
}
