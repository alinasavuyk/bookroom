import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuth } from '@/lib/apiAuth';
import { parseBody } from '@/lib/apiValidation';
import { orderActionSchema } from '@/lib/apiSchemas';
import Order from '@/models/Order';
import Book from '@/models/Book';
import { createMessageAndNotify } from '@/lib/notifications';

// PATCH /api/orders/:id — підтвердити (лише продавець) чи скасувати
// (покупець або продавець) замовлення
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const meId = auth.userId;

  const { id } = await params;
  const body = await parseBody(request, orderActionSchema);
  if (body.error) return body.error;
  const { action } = body.data;

  await connectDB();
  const order = await Order.findById(id);
  if (!order) return NextResponse.json({ error: 'Замовлення не знайдено' }, { status: 404 });

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

    await createMessageAndNotify({
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

    await createMessageAndNotify({
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
