import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { isNonEmpty } from '@/lib/validation';

// GET /api/users/:id — профіль користувача з його книгами
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const { id } = await params;
  const user = await User.findById(id).populate('savedBooks').select('-password');
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
