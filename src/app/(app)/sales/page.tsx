import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SalesTabs from "@/components/layout/sales-tabs";
import { Card, Button } from "@/components/ui/primitives";
import { fmtMoney } from "@/lib/format";

export default async function SalesOverviewPage() {
  const supabase = await createClient();

  const { data: profile } = await supabase.from("users").select("currency_symbol").single();
  const currency = profile?.currency_symbol ?? "₦";

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
  const startOfWeek = new Date(today.getTime() - 6 * 86400000).toISOString();

  const [{ data: todaySales }, { data: weekSales }, { data: recent }] = await Promise.all([
    supabase.from("sales").select("total_amount, gross_profit").gte("sale_date", startOfToday),
    supabase.from("sales").select("total_amount").gte("sale_date", startOfWeek),
    supabase
      .from("sales")
      .select("sale_id, product_name, total_amount, payment_status, customer_name, sale_date")
      .order("sale_date", { ascending: false })
      .limit(8),
  ]);

  const revenueToday = (todaySales ?? []).reduce((s, r) => s + (Number(r.total_amount) || 0), 0);
  const profitToday = (todaySales ?? []).reduce((s, r) => s + (Number(r.gross_profit) || 0), 0);
  const revenueWeek = (weekSales ?? []).reduce((s, r) => s + (Number(r.total_amount) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl">Sales</h1>
          <p className="text-sm text-foreground/60">Cart, receipts, sales history, and void.</p>
        </div>
        <Link href="/sales/new">
          <Button>Record a sale</Button>
        </Link>
      </div>
      <SalesTabs />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Kpi label="Revenue today" value={fmtMoney(revenueToday, currency)} accent="jade" />
        <Kpi label="Profit today" value={fmtMoney(profitToday, currency)} accent="brass" />
        <Kpi label="Revenue this week" value={fmtMoney(revenueWeek, currency)} accent="jade" />
      </div>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium">Recent sales</h2>
          <Link href="/sales/history" className="text-sm text-brass-600 hover:underline">
            View all
          </Link>
        </div>
        {(recent ?? []).length === 0 ? (
          <p className="text-sm text-foreground/60">No sales recorded yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {(recent ?? []).map((s) => (
              <li key={s.sale_id} className="py-2.5 flex justify-between text-sm">
                <div>
                  <p className="font-medium">{s.product_name}</p>
                  <p className="text-xs text-foreground/50">
                    {s.customer_name || "Walk-in"} · {new Date(s.sale_date).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p>{fmtMoney(Number(s.total_amount), currency)}</p>
                  <p className="text-xs text-foreground/50 capitalize">{s.payment_status}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string; accent: "jade" | "brass" }) {
  const color = { jade: "text-jade-500", brass: "text-brass-500" }[accent];
  return (
    <Card>
      <p className="text-xs uppercase tracking-wide text-foreground/50">{label}</p>
      <p className={`font-display text-3xl mt-1 ${color}`}>{value}</p>
    </Card>
  );
}
