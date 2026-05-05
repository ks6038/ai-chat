import { SignJWT, jwtVerify } from "jose";

const SEVEN_DAYS_S = 7 * 24 * 60 * 60;

function getSecret(): Uint8Array {
  const s = process.env.SESSION_SECRET || process.env.ACCESS_CODE || "dev-secret";
  return new TextEncoder().encode(s);
}

/** Creates a signed HS256 JWT valid for 7 days. Edge-compatible. */
export async function signAccessToken(): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SEVEN_DAYS_S}s`)
    .sign(getSecret());
}

/** Returns true if the token is a valid, unexpired HS256 JWT. Edge-compatible. */
export async function verifyAccessToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, getSecret());
    return true;
  } catch {
    return false;
  }
}

/** Validates the shared access passcode. Runs in Node.js API routes only. */
export function verifyAccessCode(code: string): boolean {
  const expected = process.env.ACCESS_CODE;
  if (!expected || code.length !== expected.length) return false;
  // Use Node.js timingSafeEqual to prevent timing attacks
  const { timingSafeEqual } = require("crypto") as typeof import("crypto");
  try {
    return timingSafeEqual(Buffer.from(code), Buffer.from(expected));
  } catch {
    return false;
  }
}

/** Validates the admin passcode. Runs in Node.js API routes only. */
export function verifyAdminCode(code: string): boolean {
  const expected = process.env.ADMIN_CODE;
  if (!expected || code.length !== expected.length) return false;
  const { timingSafeEqual } = require("crypto") as typeof import("crypto");
  try {
    return timingSafeEqual(Buffer.from(code), Buffer.from(expected));
  } catch {
    return false;
  }
}
