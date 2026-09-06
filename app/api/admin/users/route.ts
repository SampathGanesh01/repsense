import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { generateAccessCode } from "@/lib/accessCode";
import { effectiveCurrentStreak } from "@/lib/streak";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const users = await db.user.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(
    users.map((u) => ({
      id: u.id,
      name: u.name,
      accessCode: u.accessCode,
      currentStreak: effectiveCurrentStreak(u),
      createdAt: u.createdAt,
    })),
  );
}

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) return NextResponse.json({ error: "Name is required." }, { status: 400 });

  const existing = await db.user.findFirst({ where: { name } });
  if (existing) {
    return NextResponse.json({ id: existing.id, name: existing.name, accessCode: existing.accessCode, reused: true });
  }

  const user = await db.user.create({ data: { name, accessCode: generateAccessCode() } });
  return NextResponse.json({ id: user.id, name: user.name, accessCode: user.accessCode, reused: false });
}
