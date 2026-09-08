import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { isValidPassword, isNonEmpty } from '@/lib/validation';

// POST /api/users/:id/password — змінити пароль (з перевіркою поточного)
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const { id } = await params;
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
