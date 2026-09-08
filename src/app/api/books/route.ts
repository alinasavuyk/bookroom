import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Book from '@/models/Book';
import { isNonEmpty } from '@/lib/validation';

// GET /api/books?genre=&search=&owner= — каталог з фільтрами
export async function GET(request: Request) {
  await connectDB();
  const { searchParams } = new URL(request.url);
  const genre = searchParams.get('genre');
  const search = searchParams.get('search');
  const owner = searchParams.get('owner');

  const query: Record<string, unknown> = {};
  if (genre) query.genre = genre;
  if (search) query.title = { $regex: search, $options: 'i' };
  if (owner) query.owner = owner;

  const books = await Book.find(query).populate('owner', 'name avatar').sort({ createdAt: -1 });
  return NextResponse.json(books);
}

// POST /api/books — додати нову книгу на продаж/обмін (лише для залогінених)
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Потрібно увійти в акаунт' }, { status: 401 });
  }

  await connectDB();
  const data = await request.json();

  if (!isNonEmpty(data.title) || !isNonEmpty(data.author)) {
    return NextResponse.json({ error: 'Заповни назву й автора книги' }, { status: 400 });
  }

  const book = await Book.create({ ...data, owner: session.user.id });
  return NextResponse.json(book, { status: 201 });
}
