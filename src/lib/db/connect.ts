import mongoose from "mongoose";

// Module-level cache reused across hot reloads in dev and requests in prod
declare global {
  // eslint-disable-next-line no-var
  var _mongooseConn: typeof mongoose | null;
}

let cached = global._mongooseConn ?? null;

export async function connectDB(): Promise<typeof mongoose> {
  if (cached) return cached;

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI environment variable is not defined");

  cached = await mongoose.connect(uri, { bufferCommands: false });
  global._mongooseConn = cached;
  return cached;
}
