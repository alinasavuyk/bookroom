import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireSelf } from '@/lib/apiAuth';
import { parseBody } from '@/lib/apiValidation';
import { userIdBodySchema } from '@/lib/apiSchemas';
import User from '@/models/User';

// POST /api/users/:id/blocked-users — заблокувати користувача — лише собі
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireSelf(id);
  if (auth.error) return auth.error;

  const body = await parseBody(request, userIdBodySchema);
  if (body.error) return body.error;
  const { userId } = body.data;

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
  const { id } = await params;
  const auth = await requireSelf(id);
  if (auth.error) return auth.error;

  const body = await parseBody(request, userIdBodySchema);
  if (body.error) return body.error;

  await connectDB();
  const user = await User.findByIdAndUpdate(id, { $pull: { blockedUsers: body.data.userId } }, { new: true }).select(
    '-password'
  );

  if (!user) return NextResponse.json({ error: 'Користувача не знайдено' }, { status: 404 });
  return NextResponse.json(user);
}
