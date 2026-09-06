import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/adminAuth";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const requests = await db.exerciseRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true } } },
  });

  return NextResponse.json(
    requests.map((r) => ({
      id: r.id,
      exerciseName: r.exerciseName,
      videoUrl: r.videoUrl,
      requestedBy: r.user.name,
      createdAt: r.createdAt,
    })),
  );
}
