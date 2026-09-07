import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { isNonEmpty } from '@/lib/validation';

// GET /api/users/:id — профіль користувача з його книгами
export async function GET(request: Request, { params }: { params: { id: string } }) {
  await connectDB();
  const user = await User.findById(params.id).populate('savedBooks').select('-password');
  if (!user) return NextResponse.json({ error: 'Користувача не знайдено' }, { status: 404 });
  return NextResponse.json(user);
}

// PATCH /api/users/:id — оновити профіль (ім'я, аватар)
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  await connectDB();
  const data = await request.json();
  delete data.password; // пароль міняємо окремим захищеним роутом

  if ('name' in data && !isNonEmpty(data.name)) {
    return NextResponse.json({ error: "Ім'я не може бути порожнім" }, { status: 400 });
  }

  const user = await User.findByIdAndUpdate(params.id, data, { new: true }).select('-password');
  return NextResponse.json(user);
}
