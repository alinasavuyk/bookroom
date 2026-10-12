import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { isNonEmpty } from '@/lib/validation';

// GET /api/users/:id — публічний профіль користувача; кошик і збережені книги
// повертаються лише власнику цього профілю (приватні дані)
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  await connectDB();
  const { id } = await params;
  const isSelf = session?.user?.id === id;

  const query = User.findById(id).select('-password');
  if (isSelf) {
    query
      .populate({ path: 'savedBooks', populate: { path: 'owner', select: 'name avatar' } })
      .populate({ path: 'cart', populate: { path: 'owner', select: 'name avatar' } });
  } else {
    query.select('-savedBooks -cart');
  }

  const user = await query;
  if (!user) return NextResponse.json({ error: 'Користувача не знайдено' }, { status: 404 });
  return NextResponse.json(user);
}

// PATCH /api/users/:id — оновити профіль (ім'я, аватар) — лише свій
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Потрібно увійти в акаунт' }, { status: 401 });
  }

  const { id } = await params;
  if (session.user.id !== id) {
    return NextResponse.json({ error: 'Немає доступу до цього профілю' }, { status: 403 });
  }

  await connectDB();
  const data = await request.json();
  delete data.password; // пароль міняємо окремим захищеним роутом

  if ('name' in data && !isNonEmpty(data.name)) {
    return NextResponse.json({ error: "Ім'я не може бути порожнім" }, { status: 400 });
  }

  const user = await User.findByIdAndUpdate(id, data, { new: true }).select('-password');
  return NextResponse.json(user);
}
