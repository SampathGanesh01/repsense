import "server-only";
import crypto from "crypto";
import { cookies } from "next/headers";
import { db } from "./db";

// No passwords for this pilot — each user has a private access code (baked
// into the invite link you send them) that logs them into a signed,
// httpOnly session cookie. Good enough for 15-20 known participants.
const COOKIE_NAME = "pt_session";
const SECRET = process.env.SESSION_SECRET ?? "dev-only-secret-change-me";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 90; // 90 days comfortably covers a 4-6 week pilot

function sign(value: string): string {
  const hmac = crypto.createHmac("sha256", SECRET).update(value).digest("hex");
  return `${value}.${hmac}`;
}

function verify(signed: string): string | null {
  const idx = signed.lastIndexOf(".");
  if (idx === -1) return null;
  const value = signed.slice(0, idx);
  const sig = signed.slice(idx + 1);
  const expected = crypto.createHmac("sha256", SECRET).update(value).digest("hex");
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length) return null;
  return crypto.timingSafeEqual(sigBuf, expBuf) ? value : null;
}

export async function createSession(userId: string): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_NAME, sign(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function getCurrentUserId(): Promise<string | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  return verify(raw);
}

export async function requireUser() {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  return db.user.findUnique({ where: { id: userId } });
}
