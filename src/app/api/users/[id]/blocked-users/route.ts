import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

// POST /api/users/:id/blocked-users — заблокувати користувача — лише собі
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Потрібно увійти в акаунт' }, { status: 401 });
  }

  const { id } = await params;
  if (session.user.id !== id) {
    return NextResponse.json({ error: 'Немає доступу до цього профілю' }, { status: 403 });
  }

  const { userId } = await request.json();
  if (userId === id) {
    return NextResponse.json({ error: 'Не можна заблокувати самого себе' }, { status: 400 });
  }

  await connectDB();
  const user = await User.findByIdAndUpdate(id, { $addToSet: { blockedUsers: userId } }, { new: true }).select(
    '-password'
  );

  if (!user) return NextResponse.json({ error: 'Користувача не знайдено' }, { status: 404 });
  return NextResponse.json(user);
}

// DELETE /api/users/:id/blocked-users — розблокувати користувача — лише собі
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Потрібно увійти в акаунт' }, { status: 401 });
  }

  const { id } = await params;
  if (session.user.id !== id) {
    return NextResponse.json({ error: 'Немає доступу до цього профілю' }, { status: 403 });
  }

  const { userId } = await request.json();

  await connectDB();
  const user = await User.findByIdAndUpdate(id, { $pull: { blockedUsers: userId } }, { new: true }).select(
    '-password'
  );

  if (!user) return NextResponse.json({ error: 'Користувача не знайдено' }, { status: 404 });
  return NextResponse.json(user);
}
