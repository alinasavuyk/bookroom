import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Order from '@/models/Order';
import Book from '@/models/Book';
import Message from '@/models/Message';

// PATCH /api/orders/:id — підтвердити (лише продавець) чи скасувати
// (покупець або продавець) замовлення
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Потрібно увійти в акаунт' }, { status: 401 });
  }

  const { id } = await params;
  const { action } = await request.json();
  if (action !== 'cancel' && action !== 'confirm') {
    return NextResponse.json({ error: 'Невідома дія' }, { status: 400 });
  }

  await connectDB();
  const order = await Order.findById(id);
  if (!order) return NextResponse.json({ error: 'Замовлення не знайдено' }, { status: 404 });

  const meId = session.user.id;
  const isBuyer = order.buyer.toString() === meId;
  const isSeller = order.seller.toString() === meId;
  if (!isBuyer && !isSeller) {
    return NextResponse.json({ error: 'Немає доступу до цього замовлення' }, { status: 403 });
  }

  if (action === 'confirm') {
    if (!isSeller) {
      return NextResponse.json({ error: 'Підтвердити замовлення може лише продавець' }, { status: 403 });
    }
    if (order.status !== 'active') {
      return NextResponse.json({ error: 'Це замовлення вже не очікує підтвердження' }, { status: 400 });
    }

    order.status = 'confirmed';
    await order.save();

    await Message.create({
      sender: meId,
      receiver: order.buyer,
      book: order.book,
      text: `Продавець підтвердив замовлення на книгу «${order.bookTitle}». Очікуй на зв'язок щодо передачі.`,
    });
  } else {
    if (order.status === 'cancelled') {
      return NextResponse.json({ error: 'Замовлення вже скасовано' }, { status: 400 });
    }

    order.status = 'cancelled';
    await order.save();

    const book = await Book.findById(order.book);
    if (book && book.status === 'reserved') {
      book.status = 'available';
      await book.save();
    }

    await Message.create({
      sender: meId,
      receiver: isBuyer ? order.seller : order.buyer,
      book: order.book,
      text: `${isBuyer ? 'Покупець' : 'Продавець'} скасував замовлення на книгу «${order.bookTitle}».`,
    });
  }

  await order.populate('buyer', 'name avatar');
  await order.populate('seller', 'name avatar');

  return NextResponse.json(order);
}
