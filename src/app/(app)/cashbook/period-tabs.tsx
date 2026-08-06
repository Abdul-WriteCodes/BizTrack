"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { clsx } from "clsx";

const PERIODS = [
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "all", label: "All time" },
] as const;

export default function PeriodTabs() {
  const searchParams = useSearchParams();
  const current = searchParams.get("period") ?? "today";

  return (
    <div className="inline-flex gap-1 rounded-lg border border-border p-1 bg-surface">
      {PERIODS.map((p) => (
        <Link
          key={p.value}
          href={`/cashbook?period=${p.value}`}
          className={clsx(
            "px-3 py-1.5 rounded-md text-sm transition-colors",
            current === p.value
              ? "bg-brass-500 text-ink-950 font-medium"
              : "text-foreground/60 hover:bg-border/60"
          )}
        >
          {p.label}
        </Link>
      ))}
    </div>
  );
}
