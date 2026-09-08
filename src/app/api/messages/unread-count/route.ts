import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Message from '@/models/Message';

// GET /api/messages/unread-count — кількість непрочитаних повідомлень поточного користувача
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Потрібно увійти в акаунт' }, { status: 401 });
  }

  await connectDB();
  const count = await Message.countDocuments({ receiver: session.user.id, read: false });
  return NextResponse.json({ count });
}
