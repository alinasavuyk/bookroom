import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuth } from '@/lib/apiAuth';
import { parseBody } from '@/lib/apiValidation';
import { createReportSchema } from '@/lib/apiSchemas';
import Report from '@/models/Report';

// POST /api/reports — поскаржитись на користувача (лише залогінені)
export async function POST(request: Request) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const body = await parseBody(request, createReportSchema);
  if (body.error) return body.error;
  const { reportedUserId, reason } = body.data;

  if (reportedUserId === auth.userId) {
    return NextResponse.json({ error: 'Не можна поскаржитись на самого себе' }, { status: 400 });
  }

  await connectDB();
  const report = await Report.create({
    reporter: auth.userId,
    reportedUser: reportedUserId,
    reason,
  });

  return NextResponse.json(report, { status: 201 });
}
