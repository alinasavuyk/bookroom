import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuth } from '@/lib/apiAuth';
import Message from '@/models/Message';

// GET /api/messages/unread-count — кількість непрочитаних повідомлень поточного користувача
export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  await connectDB();
  const count = await Message.countDocuments({ receiver: auth.userId, read: false });
  return NextResponse.json({ count });
}
