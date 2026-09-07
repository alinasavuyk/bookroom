import mongoose, { Mongoose } from 'mongoose';

if (!process.env.MONGODB_URI) {
  throw new Error('Будь ласка, додай MONGODB_URI у файл .env.local');
}

const MONGODB_URI: string = process.env.MONGODB_URI;

interface MongooseCache {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

// Кешуємо з'єднання, щоб не створювати нове при кожному API-запиті
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    cached!.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    }).then((mongoose) => mongoose);
  }

  cached!.conn = await cached!.promise;
  return cached!.conn;
}
