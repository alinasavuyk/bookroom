import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { requireSelf } from '@/lib/apiAuth';
import { parseBody } from '@/lib/apiValidation';
import { updateProfileSchema } from '@/lib/apiSchemas';
import User from '@/models/User';

// GET /api/users/:id — публічний профіль користувача; кошик і збережені книги
// повертаються лише власнику цього профілю (приватні дані)
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  await connectDB();
  const { id } = await params;
  const isSelf = session?.user?.id === id;

  const query = User.findById(id).select('-password');
  if (isSelf) {
    query
      .populate({ path: 'savedBooks', populate: { path: 'owner', select: 'name avatar' } })
      .populate({ path: 'cart', populate: { path: 'owner', select: 'name avatar' } });
  } else {
    query.select('-savedBooks -cart -blockedUsers');
  }

  const user = await query;
  if (!user) return NextResponse.json({ error: 'Користувача не знайдено' }, { status: 404 });
  return NextResponse.json(user);
}

// PATCH /api/users/:id — оновити профіль (ім'я, аватар) — лише свій
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireSelf(id);
  if (auth.error) return auth.error;

  await connectDB();
  const body = await parseBody(request, updateProfileSchema);
  if (body.error) return body.error;

  const user = await User.findByIdAndUpdate(id, body.data, { new: true }).select('-password');
  return NextResponse.json(user);
}
