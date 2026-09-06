import "server-only";
import crypto from "crypto";
import { cookies } from "next/headers";

// Separate from participant auth (lib/auth.ts) on purpose: this gates a
// single shared admin password (ADMIN_SECRET), not a per-user access code,
// and uses its own cookie so the two sessions never collide.
const COOKIE_NAME = "pt_admin_session";
const SECRET = process.env.SESSION_SECRET ?? "dev-only-secret-change-me";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

function sign(value: string): string {
  return `${value}.${crypto.createHmac("sha256", SECRET).update(value).digest("hex")}`;
}

function verify(signed: string): boolean {
  const idx = signed.lastIndexOf(".");
  if (idx === -1) return false;
  const value = signed.slice(0, idx);
  const sig = signed.slice(idx + 1);
  const expected = crypto.createHmac("sha256", SECRET).update(value).digest("hex");
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  return value === "admin" && sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);
}

export function checkAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_SECRET;
  if (!expected) return false; // refuse to authenticate if no secret is configured
  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function createAdminSession(): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_NAME, sign("admin"), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearAdminSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const jar = await cookies();
  const raw = jar.get(COOKIE_NAME)?.value;
  return raw ? verify(raw) : false;
}
