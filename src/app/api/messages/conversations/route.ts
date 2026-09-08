import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Message from '@/models/Message';
import User from '@/models/User';

// GET /api/messages/conversations — список розмов поточного користувача,
// відсортований за часом останнього повідомлення, з лічильником непрочитаних
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Потрібно увійти в акаунт' }, { status: 401 });
  }

  await connectDB();
  const meId = new mongoose.Types.ObjectId(session.user.id);

  const conversations = await Message.aggregate([
    { $match: { $or: [{ sender: meId }, { receiver: meId }] } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: { $cond: [{ $eq: ['$sender', meId] }, '$receiver', '$sender'] },
        lastMessage: { $first: '$text' },
        lastMessageAt: { $first: '$createdAt' },
        unreadCount: {
          $sum: {
            $cond: [{ $and: [{ $eq: ['$receiver', meId] }, { $eq: ['$read', false] }] }, 1, 0],
          },
        },
      },
    },
    { $sort: { lastMessageAt: -1 } },
  ]);

  const userIds = conversations.map((c) => c._id);
  const users = await User.find({ _id: { $in: userIds } }, 'name avatar');
  const userMap = new Map(users.map((u) => [u._id.toString(), u]));

  const result = conversations
    .map((c) => {
      const user = userMap.get(c._id.toString());
      if (!user) return null;
      return {
        userId: c._id.toString(),
        name: user.name,
        avatar: user.avatar,
        lastMessage: c.lastMessage,
        lastMessageAt: c.lastMessageAt,
        unreadCount: c.unreadCount,
      };
    })
    .filter(Boolean);

  return NextResponse.json(result);
}
