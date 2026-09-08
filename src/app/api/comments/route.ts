import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Comment from '@/models/Comment';
import { isNonEmpty } from '@/lib/validation';

// GET /api/comments?bookId=... — усі коментарі для книги
export async function GET(request: Request) {
  await connectDB();
  const { searchParams } = new URL(request.url);
  const bookId = searchParams.get('bookId');

  const comments = await Comment.find({ book: bookId })
    .populate('author', 'name avatar')
    .sort({ createdAt: -1 });

  return NextResponse.json(comments);
}

// POST /api/comments — додати новий коментар/рецензію (лише для залогінених)
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Потрібно увійти в акаунт' }, { status: 401 });
  }

  await connectDB();
  const data = await request.json();

  if (!isNonEmpty(data.text) || !data.book) {
    return NextResponse.json({ error: 'Заповни текст рецензії' }, { status: 400 });
  }

  if (data.rating !== undefined && (data.rating < 1 || data.rating > 5)) {
    return NextResponse.json({ error: 'Оцінка має бути від 1 до 5' }, { status: 400 });
  }

  const comment = await Comment.create({
    text: data.text,
    rating: data.rating,
    book: data.book,
    author: session.user.id,
  });

  return NextResponse.json(comment, { status: 201 });
}
