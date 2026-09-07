import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

// GET /api/users/:id — профіль користувача з його книгами
export async function GET(request, { params }) {
  await connectDB();
  const user = await User.findById(params.id).populate('books').select('-password');
  if (!user) return NextResponse.json({ error: 'Користувача не знайдено' }, { status: 404 });
  return NextResponse.json(user);
}

// PATCH /api/users/:id — оновити профіль (ім'я, аватар)
export async function PATCH(request, { params }) {
  await connectDB();
  const data = await request.json();
  delete data.password; // пароль міняємо окремим захищеним роутом
  const user = await User.findByIdAndUpdate(params.id, data, { new: true }).select('-password');
  return NextResponse.json(user);
}
