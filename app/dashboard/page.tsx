import { redirect } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { effectiveCurrentStreak } from "@/lib/streak";
import { EXERCISE_KEYS, EXERCISES } from "@/lib/pose/exercises";
import { StreakCalendar } from "@/components/StreakCalendar";
import { NudgeBanner } from "@/components/NudgeBanner";
import { RequestExerciseButton } from "@/components/RequestExerciseButton";
import { cardClass, eyebrowClass, sectionTitleClass } from "@/lib/ui";

export default async function DashboardPage() {
  const user = await requireUser();
  if (!user) redirect("/");

  const workouts = await db.workout.findMany({
    where: { userId: user.id, completedAt: { not: null } },
    select: { completedAt: true },
  });
  const completedDates = workouts.map((w) => (w.completedAt as Date).toISOString().slice(0, 10));

  const streak = effectiveCurrentStreak(user);

  return (
    <main className="flex-1 max-w-lg mx-auto w-full p-6 flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <p className={eyebrowClass()}>Repsensei</p>
          <h1 className="font-condensed font-bold text-2xl tracking-tight">Hi, {user.name}</h1>
        </div>
        <div className="text-right font-mono">
          <div className="text-2xl font-semibold tabular-nums">{streak}</div>
          <div className="text-xs text-muted uppercase tracking-wide">day streak</div>
        </div>
      </header>

      <NudgeBanner />

      <section>
        <h2 className={sectionTitleClass("mb-3")}>Last 28 days</h2>
        <StreakCalendar completedDates={completedDates} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className={sectionTitleClass()}>Start a workout</h2>
        {EXERCISE_KEYS.map((key) => (
          <Link key={key} href={`/workout/${key.toLowerCase()}`} className={cardClass("px-4 py-4 flex items-center justify-between")}>
            <span className="font-condensed font-semibold">{EXERCISES[key].label}</span>
            <span className="text-accent">→</span>
          </Link>
        ))}
      </section>

      <section>
        <RequestExerciseButton />
      </section>
    </main>
  );
}
