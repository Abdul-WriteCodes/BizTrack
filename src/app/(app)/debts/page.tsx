import Link from "next/link";
import { clsx } from "clsx";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/primitives";
import { fmtMoney } from "@/lib/format";
import DebtsTable, { type DebtRow } from "./debts-table";

export default async function DebtsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter = "outstanding" } = await searchParams;
  const supabase = await createClient();

  const { data: profile } = await supabase.from("users").select("currency_symbol").single();
  const currency = profile?.currency_symbol ?? "₦";

  const { data } = await supabase
    .from("debts")
    .select(
      "debt_id, customer_name, customer_phone, total_amount, amount_paid, balance, status, sale_date"
    )
    .order("sale_date", { ascending: false })
    .limit(300);

  const all: DebtRow[] = (data ?? []).map((d) => ({
    debtId: d.debt_id,
    customerName: d.customer_name ?? "",
    customerPhone: d.customer_phone ?? "",
    totalAmount: Number(d.total_amount) || 0,
    amountPaid: Number(d.amount_paid) || 0,
    balance: Number(d.balance) || 0,
    status: d.status ?? "unpaid",
    saleDate: d.sale_date,
  }));

  const outstanding = all.filter((d) => d.status !== "settled");
  const shown = filter === "all" ? all : outstanding;
  const totalOutstanding = outstanding.reduce((s, d) => s + d.balance, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Debts</h1>
        <p className="text-sm text-foreground/60">Customer debt ledger with part-payments.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <p className="text-xs uppercase tracking-wide text-foreground/50">Total outstanding</p>
          <p className="font-display text-3xl mt-1 text-ruby-500">
            {fmtMoney(totalOutstanding, currency)}
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-foreground/50">Open debts</p>
          <p className="font-display text-3xl mt-1">{outstanding.length}</p>
        </Card>
      </div>

      <div className="inline-flex gap-1 rounded-lg border border-border p-1 bg-surface">
        {(["outstanding", "all"] as const).map((f) => (
          <Link
            key={f}
            href={`/debts?filter=${f}`}
            className={clsx(
              "px-3 py-1.5 rounded-md text-sm capitalize transition-colors",
              filter === f
                ? "bg-brass-500 text-ink-950 font-medium"
                : "text-foreground/60 hover:bg-border/60"
            )}
          >
            {f}
          </Link>
        ))}
      </div>

      <DebtsTable debts={shown} currency={currency} />
    </div>
  );
}
