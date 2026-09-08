import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Book from '@/models/Book';
import { getRatingsMap } from '@/lib/ratings';
import { isNonEmpty } from '@/lib/validation';
import { OTHER_GENRE, STANDARD_BOOK_GENRES } from '@/lib/genres';

// GET /api/books?genre=&type=&search=&owner=&minPrice=&maxPrice= — каталог з фільтрами
export async function GET(request: Request) {
  await connectDB();
  const { searchParams } = new URL(request.url);
  const genre = searchParams.get('genre');
  const type = searchParams.get('type');
  const search = searchParams.get('search');
  const owner = searchParams.get('owner');
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');

  const query: Record<string, unknown> = {};
  if (genre) {
    const selected = genre.split(',');
    const wantsOther = selected.includes(OTHER_GENRE);
    const standardSelected = selected.filter((g) => g !== OTHER_GENRE);

    if (wantsOther && standardSelected.length > 0) {
      // "Інші" = жанри поза стандартним списком; поєднуємо з обраними стандартними через $or
      query.$or = [
        { genres: { $in: standardSelected } },
        { genres: { $nin: STANDARD_BOOK_GENRES as unknown as string[] } },
      ];
    } else if (wantsOther) {
      query.genres = { $nin: STANDARD_BOOK_GENRES as unknown as string[] };
    } else {
      query.genres = { $in: standardSelected };
    }
  }
  if (type) query.type = { $in: type.split(',') };
  if (search) query.title = { $regex: search, $options: 'i' };
  if (owner) query.owner = owner;
  if (minPrice || maxPrice) {
    const priceFilter: Record<string, number> = {};
    if (minPrice) priceFilter.$gte = Number(minPrice);
    if (maxPrice) priceFilter.$lte = Number(maxPrice);
    query.price = priceFilter;
  }

  const books = await Book.find(query).populate('owner', 'name avatar').sort({ createdAt: -1 }).lean();
  const ratingsMap = await getRatingsMap(books.map((b) => b._id));

  const booksWithRatings = books.map((b) => ({
    ...b,
    avgRating: ratingsMap.get(b._id.toString())?.avgRating ?? 0,
    reviewCount: ratingsMap.get(b._id.toString())?.reviewCount ?? 0,
  }));

  return NextResponse.json(booksWithRatings);
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

  if (!Array.isArray(data.genres) || data.genres.length === 0) {
    return NextResponse.json({ error: 'Обери хоча б один жанр' }, { status: 400 });
  }

  const book = await Book.create({ ...data, owner: session.user.id });
  return NextResponse.json(book, { status: 201 });
}
