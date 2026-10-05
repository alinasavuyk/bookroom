import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Book from '@/models/Book';
import Message from '@/models/Message';
import Order from '@/models/Order';

const PAYMENT_LABEL: Record<string, string> = {
  cash: 'Готівкою при отриманні',
  card: 'Переказ на карту',
  cod: 'Накладений платіж',
};

// POST /api/users/:id/cart/checkout — оформити всі книги з кошика: позначити
// їх зарезервованими і надіслати власникам автоматичне повідомлення
// з даними доставки (лише собі)
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Потрібно увійти в акаунт' }, { status: 401 });
  }

  const { id } = await params;
  if (session.user.id !== id) {
    return NextResponse.json({ error: 'Немає доступу до цього профілю' }, { status: 403 });
  }

  const { city, warehouse, paymentMethod } = await request.json();
  if (!city || !warehouse || !PAYMENT_LABEL[paymentMethod]) {
    return NextResponse.json({ error: 'Вкажи місто, відділення й спосіб оплати' }, { status: 400 });
  }

  await connectDB();
  const user = await User.findById(id);
  if (!user) return NextResponse.json({ error: 'Користувача не знайдено' }, { status: 404 });

  const cartBooks = await Book.find({ _id: { $in: user.cart } });

  const deliveryLine = `Доставка: Нова Пошта, ${city}, відділення ${warehouse}. Оплата: ${PAYMENT_LABEL[paymentMethod]}.`;

  const ordered: string[] = [];
  const unavailable: string[] = [];

  for (const book of cartBooks) {
    if (book.status !== 'available') {
      unavailable.push(book.title);
      continue;
    }

    book.status = 'reserved';
    await book.save();

    await Message.create({
      sender: id,
      receiver: book.owner,
      book: book._id,
      text: `Хочу купити книгу «${book.title}» за ${book.price} ₴. ${deliveryLine} Напишіть, будь ласка, як домовитись про передачу.`,
    });

    await Order.create({
      book: book._id,
      bookTitle: book.title,
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
