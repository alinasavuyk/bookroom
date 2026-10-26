import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuth } from '@/lib/apiAuth';
import { parseBody } from '@/lib/apiValidation';
import { createCommentSchema } from '@/lib/apiSchemas';
import Comment from '@/models/Comment';

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
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  await connectDB();
  const body = await parseBody(request, createCommentSchema);
  if (body.error) return body.error;
  const { text, rating, book } = body.data;

  const comment = await Comment.create({
    text,
    rating,
    book,
    author: auth.userId,
  });

  return NextResponse.json(comment, { status: 201 });
}
