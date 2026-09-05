import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession, clearSession } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const accessCode = typeof body?.accessCode === "string" ? body.accessCode.trim() : "";
  if (!accessCode) {
    return NextResponse.json({ error: "Access code is required." }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { accessCode } });
  if (!user) {
    return NextResponse.json({ error: "That access code wasn't recognized." }, { status: 401 });
  }

  await createSession(user.id);
  return NextResponse.json({ id: user.id, name: user.name });
}

export async function DELETE() {
  await clearSession();
  return NextResponse.json({ ok: true });
}
