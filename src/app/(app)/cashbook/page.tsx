import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/primitives";
import { fmtMoney } from "@/lib/format";
import PeriodTabs from "./period-tabs";
import AddEntryButton from "./add-entry-button";

type Entry = {
  entry_id: string;
  entry_date: string;
  entry_type: string;
  direction: "In" | "Out";
  amount: number;
  payment_method: string;
  note: string;
  recorded_by: string;
};

const ENTRY_ICON: Record<string, string> = {
  Sale: "🛒",
  Expense: "💸",
  Restock: "📦",
  "Debt Collection": "📕",
  Manual: "✍️",
};

function periodRange(period: string): { start: Date | null; end: Date | null } {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (period === "today") return { start: startOfDay, end: null };
  if (period === "week") {
    const day = startOfDay.getDay(); // 0 = Sun
    const diffToMonday = day === 0 ? 6 : day - 1;
    const monday = new Date(startOfDay);
    monday.setDate(startOfDay.getDate() - diffToMonday);
    return { start: monday, end: null };
  }
  if (period === "month") {
    return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: null };
  }
  return { start: null, end: null }; // all time
}

export default async function CashbookPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period = "today" } = await searchParams;
  const supabase = await createClient();

  const { data: profile } = await supabase.from("users").select("currency_symbol").single();
  const currency = profile?.currency_symbol ?? "₦";

  const { data } = await supabase
    .from("cashbook_entries")
    .select("entry_id, entry_date, entry_type, direction, amount, payment_method, note, recorded_by")
    .order("entry_date", { ascending: false })
    .limit(1000);

  const all: Entry[] = data ?? [];
  const { start } = periodRange(period);

  const before = start ? all.filter((e) => new Date(e.entry_date) < start) : [];
  const inWindow = start ? all.filter((e) => new Date(e.entry_date) >= start) : all;

  const opening = round2(before.reduce((s, e) => s + signed(e), 0));
  const totalIn = round2(inWindow.filter((e) => e.direction === "In").reduce((s, e) => s + Number(e.amount), 0));
  const totalOut = round2(inWindow.filter((e) => e.direction === "Out").reduce((s, e) => s + Number(e.amount), 0));
  const closing = round2(opening + totalIn - totalOut);

  const methodTotals = new Map<string, number>();
  for (const e of inWindow) {
    methodTotals.set(e.payment_method, (methodTotals.get(e.payment_method) ?? 0) + signed(e));
  }

  const typeTotals = new Map<string, number>();
  for (const e of inWindow) {
    typeTotals.set(e.entry_type, (typeTotals.get(e.entry_type) ?? 0) + 1);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl">Cashbook</h1>
          <p className="text-sm text-foreground/60">
            Every cash movement in and out of the business — and what remains.
          </p>
        </div>
        <AddEntryButton />
      </div>

      <PeriodTabs />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Kpi label="Opening" value={fmtMoney(opening, currency)} />
        <Kpi label="Cash in" value={fmtMoney(totalIn, currency)} accent="jade" />
        <Kpi label="Cash out" value={fmtMoney(totalOut, currency)} accent="ruby" />
        <Kpi label="Closing balance" value={fmtMoney(closing, currency)} accent="brass" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h2 className="font-medium mb-3">Where the cash sits</h2>
          {methodTotals.size === 0 ? (
            <p className="text-sm text-foreground/60">No activity in this period.</p>
          ) : (
            <ul className="space-y-2">
              {[...methodTotals.entries()].map(([method, net]) => (
                <li key={method} className="flex justify-between text-sm">
                  <span className="text-foreground/70">{method}</span>
                  <span className={net >= 0 ? "text-jade-500" : "text-ruby-500"}>
                    {fmtMoney(net, currency)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="font-medium mb-3">Activity breakdown</h2>
          {typeTotals.size === 0 ? (
            <p className="text-sm text-foreground/60">No activity in this period.</p>
          ) : (
            <ul className="space-y-2">
              {[...typeTotals.entries()].map(([type, count]) => (
                <li key={type} className="flex justify-between text-sm">
                  <span className="text-foreground/70">
                    {ENTRY_ICON[type] ?? "•"} {type}
                  </span>
                  <span className="text-foreground/50">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card>
        <h2 className="font-medium mb-3">Ledger</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-foreground/60">
              <tr>
                <th className="py-2 font-medium">Date</th>
                <th className="py-2 font-medium">Type</th>
                <th className="py-2 font-medium">Note</th>
                <th className="py-2 font-medium">Method</th>
                <th className="py-2 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {inWindow.slice(0, 100).map((e) => (
                <tr key={e.entry_id}>
                  <td className="py-2 whitespace-nowrap text-foreground/60">
                    {new Date(e.entry_date).toLocaleString()}
                  </td>
                  <td className="py-2">
                    {ENTRY_ICON[e.entry_type] ?? "•"} {e.entry_type}
                  </td>
                  <td className="py-2 text-foreground/70">{e.note}</td>
                  <td className="py-2 text-foreground/60">{e.payment_method}</td>
                  <td className={`py-2 text-right ${e.direction === "In" ? "text-jade-500" : "text-ruby-500"}`}>
                    {e.direction === "In" ? "+" : "\u2212"}
                    {fmtMoney(Number(e.amount), currency)}
                  </td>
                </tr>
              ))}
              {inWindow.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-foreground/50">
                    No entries in this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function signed(e: Entry) {
  return e.direction === "In" ? Number(e.amount) : -Number(e.amount);
}
function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function Kpi({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "jade" | "ruby" | "brass";
}) {
  const color = accent
    ? { jade: "text-jade-500", ruby: "text-ruby-500", brass: "text-brass-500" }[accent]
    : "text-foreground";
  return (
    <Card>
      <p className="text-xs uppercase tracking-wide text-foreground/50">{label}</p>
      <p className={`font-display text-2xl mt-1 ${color}`}>{value}</p>
    </Card>
  );
}
