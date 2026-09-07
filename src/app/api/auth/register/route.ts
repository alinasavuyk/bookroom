import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

// POST /api/auth/register — створити нового користувача
export async function POST(request: Request) {
  await connectDB();
  const { name, email, password } = await request.json();

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Заповни всі поля' }, { status: 400 });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return NextResponse.json({ error: 'Користувач з таким email вже існує' }, { status: 409 });
  }

  // Хешуємо пароль — ніколи не зберігаємо його відкритим текстом!
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    provider: 'credentials',
  });

  return NextResponse.json(
    { id: user._id, name: user.name, email: user.email },
    { status: 201 }
  );
}
