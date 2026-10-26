import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuth } from '@/lib/apiAuth';
import { parseBody } from '@/lib/apiValidation';
import { updateBookSchema } from '@/lib/apiSchemas';
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
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  await connectDB();
  const { id } = await params;

  const book = await Book.findById(id);
  if (!book) return NextResponse.json({ error: 'Книгу не знайдено' }, { status: 404 });
  if (book.owner.toString() !== auth.userId) {
    return NextResponse.json({ error: 'Немає доступу до цього оголошення' }, { status: 403 });
  }

  const body = await parseBody(request, updateBookSchema);
  if (body.error) return body.error;
  const updates = body.data;

  const nextType = updates.type ?? book.type;
  const nextPrice = updates.price ?? book.price;
  if ((nextType === 'sale' || nextType === 'both') && (!nextPrice || nextPrice <= 0)) {
    return NextResponse.json({ error: 'Вкажи ціну для продажу книги' }, { status: 400 });
  }

  const updated = await Book.findByIdAndUpdate(id, updates, { new: true });
  return NextResponse.json(updated);
}

// DELETE /api/books/:id — видалити оголошення — лише власник
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  await connectDB();
  const { id } = await params;

  const book = await Book.findById(id);
  if (!book) return NextResponse.json({ error: 'Книгу не знайдено' }, { status: 404 });
  if (book.owner.toString() !== auth.userId) {
    return NextResponse.json({ error: 'Немає доступу до цього оголошення' }, { status: 403 });
  }

  await Book.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
