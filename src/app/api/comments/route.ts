import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
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

// POST /api/comments — додати новий коментар/рецензію
export async function POST(request: Request) {
  await connectDB();
  const data = await request.json();
  const comment = await Comment.create(data);
  return NextResponse.json(comment, { status: 201 });
}
