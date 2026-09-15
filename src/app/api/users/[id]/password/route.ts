import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { isValidPassword, isNonEmpty } from '@/lib/validation';

// POST /api/users/:id/password — змінити пароль (з перевіркою поточного) — лише свій
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
  const { currentPassword, newPassword } = await request.json();

  if (!isNonEmpty(currentPassword) || !isValidPassword(newPassword)) {
    return NextResponse.json({ error: 'Перевір правильність заповнення полів' }, { status: 400 });
  }

  const user = await User.findById(id);
  if (!user || !user.password) {
    return NextResponse.json({ error: 'Користувача не знайдено' }, { status: 404 });
  }

  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) {
    return NextResponse.json({ error: 'Неправильний поточний пароль' }, { status: 401 });
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  return NextResponse.json({ success: true });
}
