import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/primitives";

export default async function DashboardPage() {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  // Every query below is scoped automatically by RLS (business_id =
  // current_business_id()) — no manual business_id filtering needed.
  const [{ data: todaySales }, { data: cashbook }, { data: lowStock }] = await Promise.all([
    supabase.from("sales").select("total_amount").gte("created_at", today),
    supabase
      .from("cashbook_entries")
      .select("amount, entry_type")
      .order("entry_date", { ascending: false })
      .limit(200),
    supabase.from("products").select("product_id, name, quantity, reorder_level").limit(500),
  ]);

  const salesToday = (todaySales ?? []).reduce((sum, r) => sum + (Number(r.total_amount) || 0), 0);
  const balance = (cashbook ?? []).reduce(
    (sum, r) => sum + (r.entry_type === "in" ? Number(r.amount) : -Number(r.amount)),
    0
  );
  const lowStockItems = (lowStock ?? []).filter(
    (p) => (p.quantity ?? 0) <= (p.reorder_level ?? 0)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Dashboard</h1>
        <p className="text-sm text-foreground/60">Today at a glance.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Kpi label="Sales today" value={salesToday.toLocaleString()} accent="jade" />
        <Kpi label="Cash balance" value={balance.toLocaleString()} accent="brass" />
        <Kpi label="Low stock items" value={String(lowStockItems.length)} accent="ruby" />
      </div>

      <Card>
        <h2 className="font-medium mb-3">Low stock</h2>
        {lowStockItems.length === 0 ? (
          <p className="text-sm text-foreground/60">Nothing needs restocking right now.</p>
        ) : (
          <ul className="divide-y divide-border">
            {lowStockItems.slice(0, 8).map((p) => (
              <li key={p.product_id} className="py-2 flex justify-between text-sm">
                <span>{p.name}</span>
                <span className="text-ruby-500">{p.quantity} left</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string; accent: "jade" | "brass" | "ruby" }) {
  const color = { jade: "text-jade-500", brass: "text-brass-500", ruby: "text-ruby-500" }[accent];
  return (
    <Card>
      <p className="text-xs uppercase tracking-wide text-foreground/50">{label}</p>
      <p className={`font-display text-3xl mt-1 ${color}`}>{value}</p>
    </Card>
  );
}
