import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Book from '@/models/Book';

// GET /api/books?genre=&search= — каталог з фільтрами
export async function GET(request: Request) {
  await connectDB();
  const { searchParams } = new URL(request.url);
  const genre = searchParams.get('genre');
  const search = searchParams.get('search');

  const query: Record<string, unknown> = {};
  if (genre) query.genre = genre;
  if (search) query.title = { $regex: search, $options: 'i' };

  const books = await Book.find(query).populate('owner', 'name avatar').sort({ createdAt: -1 });
  return NextResponse.json(books);
}

// POST /api/books — додати нову книгу на продаж/обмін
export async function POST(request: Request) {
  await connectDB();
  const data = await request.json();

  const book = await Book.create(data);
  return NextResponse.json(book, { status: 201 });
}
