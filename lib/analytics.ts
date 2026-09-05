import "server-only";
import { db } from "./db";
import type { Prisma } from "@/generated/prisma";

// Generic append-only event log. Covers the pilot analytics requirements
// (workout completions, nudge sends, nudge-to-same-day-completion, day
// 1/7/28 activity) without a dedicated analytics platform — query this
// table directly when reviewing the pilot.
export async function logEvent(userId: string, eventType: string, payload: Prisma.InputJsonValue = {}): Promise<void> {
  await db.analyticsEvent.create({ data: { userId, eventType, payload } });
}
