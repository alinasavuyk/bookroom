import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Report from '@/models/Report';
import { isNonEmpty } from '@/lib/validation';

// POST /api/reports — поскаржитись на користувача (лише залогінені)
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Потрібно увійти в акаунт' }, { status: 401 });
  }

  const { reportedUserId, reason } = await request.json();

  if (!reportedUserId || !isNonEmpty(reason)) {
    return NextResponse.json({ error: 'Опиши причину скарги' }, { status: 400 });
  }
  if (reportedUserId === session.user.id) {
    return NextResponse.json({ error: 'Не можна поскаржитись на самого себе' }, { status: 400 });
  }

  await connectDB();
  const report = await Report.create({
    reporter: session.user.id,
    reportedUser: reportedUserId,
    reason: reason.trim(),
  });

  return NextResponse.json(report, { status: 201 });
}
