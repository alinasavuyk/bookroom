import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Book from '@/models/Book';

// GET /api/books/:id — деталі однієї книги
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const { id } = await params;
  const book = await Book.findById(id).populate('owner', 'name avatar rating');
  if (!book) return NextResponse.json({ error: 'Книгу не знайдено' }, { status: 404 });
  return NextResponse.json(book);
}

// PATCH /api/books/:id — оновити (наприклад, статус: продано/зарезервовано) — лише власник
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Потрібно увійти в акаунт' }, { status: 401 });
  }

  await connectDB();
  const { id } = await params;

  const book = await Book.findById(id);
  if (!book) return NextResponse.json({ error: 'Книгу не знайдено' }, { status: 404 });
  if (book.owner.toString() !== session.user.id) {
    return NextResponse.json({ error: 'Немає доступу до цього оголошення' }, { status: 403 });
  }

  const data = await request.json();
  delete data.owner; // власника міняти не можна

  const updated = await Book.findByIdAndUpdate(id, data, { new: true });
  return NextResponse.json(updated);
}

// DELETE /api/books/:id — видалити оголошення — лише власник
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Потрібно увійти в акаунт' }, { status: 401 });
  }

  await connectDB();
  const { id } = await params;

  const book = await Book.findById(id);
  if (!book) return NextResponse.json({ error: 'Книгу не знайдено' }, { status: 404 });
  if (book.owner.toString() !== session.user.id) {
    return NextResponse.json({ error: 'Немає доступу до цього оголошення' }, { status: 403 });
  }

  await Book.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
