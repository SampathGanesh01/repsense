const DAY_MS = 86_400_000;

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

interface StreakCalendarProps {
  completedDates: string[]; // ISO "YYYY-MM-DD", UTC
  days?: number;
}

export function StreakCalendar({ completedDates, days = 28 }: StreakCalendarProps) {
  const completed = new Set(completedDates);
  const today = new Date();
  const cells = Array.from({ length: days }, (_, i) => {
    const d = new Date(today.getTime() - (days - 1 - i) * DAY_MS);
    const key = isoDate(d);
    return { key, label: d.getUTCDate(), done: completed.has(key), isToday: i === days - 1 };
  });

  return (
    <div className="grid grid-cols-7 gap-2">
      {cells.map((cell) => (
        <div
          key={cell.key}
          title={cell.key}
          className={[
            "aspect-square rounded-md flex items-center justify-center text-xs font-medium",
            cell.done ? "bg-emerald-500 text-white" : "bg-neutral-100 text-neutral-400",
            cell.isToday ? "ring-2 ring-offset-1 ring-black" : "",
          ].join(" ")}
        >
          {cell.label}
        </div>
      ))}
    </div>
  );
}
