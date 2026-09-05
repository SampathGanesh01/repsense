import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { isExerciseKey } from "@/lib/pose/exercises";
import { WorkoutSession } from "@/components/WorkoutSession";

export default async function WorkoutPage({ params }: { params: Promise<{ exercise: string }> }) {
  const user = await requireUser();
  if (!user) redirect("/");

  const { exercise } = await params;
  const key = exercise.toUpperCase();
  if (!isExerciseKey(key)) notFound();

  return <WorkoutSession exerciseKey={key} consented={Boolean(user.consentedAt)} />;
}
