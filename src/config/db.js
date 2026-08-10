import mongoose from 'mongoose';
import { config } from './env.js';

let cached = global._csMongooseConn;
if (!cached) {
  cached = global._csMongooseConn = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(config.mongoUri).then((m) => m);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
