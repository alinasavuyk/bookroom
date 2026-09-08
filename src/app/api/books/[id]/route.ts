import { NextResponse } from 'next/server';
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

// PATCH /api/books/:id — оновити (наприклад, статус: продано/зарезервовано)
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const { id } = await params;
  const data = await request.json();
  const book = await Book.findByIdAndUpdate(id, data, { new: true });
  return NextResponse.json(book);
}

// DELETE /api/books/:id — видалити оголошення
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const { id } = await params;
  await Book.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
