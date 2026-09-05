import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function POST() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  await db.user.update({ where: { id: user.id }, data: { consentedAt: new Date() } });
  return NextResponse.json({ ok: true });
}
