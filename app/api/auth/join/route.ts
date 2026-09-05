import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";

// One-click invite link for pilot participants: /api/auth/join?code=XXXX
// logs them straight into their dashboard, no manual code entry needed.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const accessCode = url.searchParams.get("code")?.trim();
  if (!accessCode) return NextResponse.redirect(new URL("/", req.url));

  const user = await db.user.findUnique({ where: { accessCode } });
  if (!user) return NextResponse.redirect(new URL("/?error=invalid_code", req.url));

  await createSession(user.id);
  return NextResponse.redirect(new URL("/dashboard", req.url));
}
