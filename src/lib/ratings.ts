import mongoose from 'mongoose';
import Comment from '@/models/Comment';

export interface RatingInfo {
  avgRating: number;
  reviewCount: number;
}

export async function getRatingsMap(bookIds: mongoose.Types.ObjectId[]): Promise<Map<string, RatingInfo>> {
  if (bookIds.length === 0) return new Map();

  const ratingAgg = await Comment.aggregate([
    { $match: { book: { $in: bookIds } } },
    { $group: { _id: '$book', avgRating: { $avg: '$rating' }, reviewCount: { $sum: 1 } } },
  ]);

  return new Map(
    ratingAgg.map((r) => [r._id.toString(), { avgRating: r.avgRating as number, reviewCount: r.reviewCount as number }])
  );
}
