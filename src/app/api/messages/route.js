import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Message from '@/models/Message';

// GET /api/messages?userA=...&userB=... — історія переписки двох користувачів
export async function GET(request) {
  await connectDB();
  const { searchParams } = new URL(request.url);
  const userA = searchParams.get('userA');
  const userB = searchParams.get('userB');

  const messages = await Message.find({
    $or: [
      { sender: userA, receiver: userB },
      { sender: userB, receiver: userA },
    ],
  }).sort({ createdAt: 1 });

  return NextResponse.json(messages);
}

// POST /api/messages — надіслати нове повідомлення
export async function POST(request) {
  await connectDB();
  const data = await request.json();
  const message = await Message.create(data);
  return NextResponse.json(message, { status: 201 });
}
