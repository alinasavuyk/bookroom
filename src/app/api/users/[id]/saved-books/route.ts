import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

// POST /api/users/:id/saved-books — додати книгу в збережені
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const { id } = await params;
  const { bookId } = await request.json();

  const user = await User.findByIdAndUpdate(
    id,
    { $addToSet: { savedBooks: bookId } },
    { new: true }
  ).select('-password');

  if (!user) return NextResponse.json({ error: 'Користувача не знайдено' }, { status: 404 });
  return NextResponse.json(user);
}

// DELETE /api/users/:id/saved-books — прибрати книгу зі збережених
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const { id } = await params;
  const { bookId } = await request.json();

  const user = await User.findByIdAndUpdate(
    id,
    { $pull: { savedBooks: bookId } },
    { new: true }
  ).select('-password');

  if (!user) return NextResponse.json({ error: 'Користувача не знайдено' }, { status: 404 });
  return NextResponse.json(user);
}
