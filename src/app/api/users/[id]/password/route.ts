import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/mongodb';
import { requireSelf } from '@/lib/apiAuth';
import { parseBody } from '@/lib/apiValidation';
import { changePasswordSchema } from '@/lib/apiSchemas';
import User from '@/models/User';

// POST /api/users/:id/password — змінити пароль (з перевіркою поточного) — лише свій
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireSelf(id);
  if (auth.error) return auth.error;

  await connectDB();
  const body = await parseBody(request, changePasswordSchema);
  if (body.error) return body.error;
  const { currentPassword, newPassword } = body.data;

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
