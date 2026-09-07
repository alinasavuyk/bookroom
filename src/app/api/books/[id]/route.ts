import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Book from '@/models/Book';

// GET /api/books/:id — деталі однієї книги
export async function GET(request: Request, { params }: { params: { id: string } }) {
  await connectDB();
  const book = await Book.findById(params.id).populate('owner', 'name avatar rating');
  if (!book) return NextResponse.json({ error: 'Книгу не знайдено' }, { status: 404 });
  return NextResponse.json(book);
}

// PATCH /api/books/:id — оновити (наприклад, статус: продано/зарезервовано)
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  await connectDB();
  const data = await request.json();
  const book = await Book.findByIdAndUpdate(params.id, data, { new: true });
  return NextResponse.json(book);
}

// DELETE /api/books/:id — видалити оголошення
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  await connectDB();
  await Book.findByIdAndDelete(params.id);
  return NextResponse.json({ success: true });
}
