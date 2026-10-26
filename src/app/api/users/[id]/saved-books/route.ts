import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireSelf } from '@/lib/apiAuth';
import { parseBody } from '@/lib/apiValidation';
import { bookIdSchema } from '@/lib/apiSchemas';
import User from '@/models/User';

// POST /api/users/:id/saved-books — додати книгу в збережені — лише собі
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireSelf(id);
  if (auth.error) return auth.error;

  await connectDB();
  const body = await parseBody(request, bookIdSchema);
  if (body.error) return body.error;

  const user = await User.findByIdAndUpdate(
    id,
    { $addToSet: { savedBooks: body.data.bookId } },
    { new: true }
  ).select('-password');

  if (!user) return NextResponse.json({ error: 'Користувача не знайдено' }, { status: 404 });
  return NextResponse.json(user);
}

// DELETE /api/users/:id/saved-books — прибрати книгу зі збережених — лише собі
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireSelf(id);
  if (auth.error) return auth.error;

  await connectDB();
  const body = await parseBody(request, bookIdSchema);
  if (body.error) return body.error;

  const user = await User.findByIdAndUpdate(
    id,
    { $pull: { savedBooks: body.data.bookId } },
    { new: true }
  ).select('-password');

  if (!user) return NextResponse.json({ error: 'Користувача не знайдено' }, { status: 404 });
  return NextResponse.json(user);
}
