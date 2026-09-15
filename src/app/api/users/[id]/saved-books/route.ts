import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

// POST /api/users/:id/saved-books — додати книгу в збережені — лише собі
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Потрібно увійти в акаунт' }, { status: 401 });
  }

  const { id } = await params;
  if (session.user.id !== id) {
    return NextResponse.json({ error: 'Немає доступу до цього профілю' }, { status: 403 });
  }

  await connectDB();
  const { bookId } = await request.json();

  const user = await User.findByIdAndUpdate(
    id,
    { $addToSet: { savedBooks: bookId } },
    { new: true }
  ).select('-password');

  if (!user) return NextResponse.json({ error: 'Користувача не знайдено' }, { status: 404 });
  return NextResponse.json(user);
}

// DELETE /api/users/:id/saved-books — прибрати книгу зі збережених — лише собі
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Потрібно увійти в акаунт' }, { status: 401 });
  }

  const { id } = await params;
  if (session.user.id !== id) {
    return NextResponse.json({ error: 'Немає доступу до цього профілю' }, { status: 403 });
  }

  await connectDB();
  const { bookId } = await request.json();

  const user = await User.findByIdAndUpdate(
    id,
    { $pull: { savedBooks: bookId } },
    { new: true }
  ).select('-password');

  if (!user) return NextResponse.json({ error: 'Користувача не знайдено' }, { status: 404 });
  return NextResponse.json(user);
}
