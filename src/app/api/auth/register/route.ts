import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/mongodb';
import { parseBody } from '@/lib/apiValidation';
import { registerSchema } from '@/lib/apiSchemas';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import User from '@/models/User';

const REGISTER_LIMIT = 5;
const REGISTER_WINDOW_MS = 15 * 60 * 1000;

// POST /api/auth/register — створити нового користувача
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const allowed = await checkRateLimit(`register:${ip}`, REGISTER_LIMIT, REGISTER_WINDOW_MS);
  if (!allowed) {
    return NextResponse.json({ error: 'Забагато спроб реєстрації. Спробуй пізніше.' }, { status: 429 });
  }

  await connectDB();
  const body = await parseBody(request, registerSchema);
  if (body.error) return body.error;
  const { name, email, password } = body.data;

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
