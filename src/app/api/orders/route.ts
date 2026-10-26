import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuth } from '@/lib/apiAuth';
import Order from '@/models/Order';

// GET /api/orders?as=buyer|seller — мої замовлення (як покупець або як продавець)
export async function GET(request: Request) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  await connectDB();
  const { searchParams } = new URL(request.url);
  const as = searchParams.get('as') === 'seller' ? 'seller' : 'buyer';

  const orders = await Order.find({ [as]: auth.userId })
    .populate('buyer', 'name avatar')
    .populate('seller', 'name avatar')
    .sort({ createdAt: -1 });

  return NextResponse.json(orders);
}
