import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Order from '@/models/Order';

// GET /api/orders?as=buyer|seller — мої замовлення (як покупець або як продавець)
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Потрібно увійти в акаунт' }, { status: 401 });
  }

  await connectDB();
  const { searchParams } = new URL(request.url);
  const as = searchParams.get('as') === 'seller' ? 'seller' : 'buyer';

  const orders = await Order.find({ [as]: session.user.id })
    .populate('buyer', 'name avatar')
    .populate('seller', 'name avatar')
    .sort({ createdAt: -1 });

  return NextResponse.json(orders);
}
