import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/primitives";
import { fmtMoney } from "@/lib/format";
import TrendChart, { type MonthPoint } from "./trend-chart";
import ExpensesTable, { type ExpenseRow } from "./expenses-table";

function monthKey(d: Date) {
  return d.toLocaleString("en", { month: "short" }) + " " + d.getFullYear();
}

export default async function HealthPage() {
  const supabase = await createClient();

  const { data: profile } = await supabase.from("users").select("currency_symbol").single();
  const currency = profile?.currency_symbol ?? "₦";

  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [{ data: sales }, { data: expenses }] = await Promise.all([
    supabase
      .from("sales")
      .select("total_amount, gross_profit, sale_date")
      .gte("sale_date", sixMonthsAgo.toISOString())
      .order("sale_date", { ascending: false }),
    supabase
      .from("expenses")
      .select("expense_id, description, category, amount, expense_date, payment_method")
      .gte("expense_date", sixMonthsAgo.toISOString().slice(0, 10))
      .order("expense_date", { ascending: false }),
  ]);

  // Build the 6-month bucket list up front so months with no activity
  // still show up as zero bars, not gaps.
  const buckets: MonthPoint[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ month: monthKey(d), revenue: 0, expenses: 0 });
  }
  const bucketIndex = (dateStr: string) => {
    const d = new Date(dateStr);
    return buckets.findIndex((b) => b.month === monthKey(new Date(d.getFullYear(), d.getMonth(), 1)));
  };

  for (const s of sales ?? []) {
    const idx = bucketIndex(s.sale_date);
    if (idx >= 0) buckets[idx].revenue += Number(s.total_amount) || 0;
  }
  for (const e of expenses ?? []) {
    const idx = bucketIndex(e.expense_date);
    if (idx >= 0) buckets[idx].expenses += Number(e.amount) || 0;
  }

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthSales = (sales ?? []).filter((s) => new Date(s.sale_date) >= monthStart);
  const monthExpenses = (expenses ?? []).filter((e) => new Date(e.expense_date) >= monthStart);

  const monthRevenue = monthSales.reduce((s, r) => s + (Number(r.total_amount) || 0), 0);
  const monthGrossProfit = monthSales.reduce((s, r) => s + (Number(r.gross_profit) || 0), 0);
  const monthExpenseTotal = monthExpenses.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const netProfit = monthGrossProfit - monthExpenseTotal;

  const expenseRows: ExpenseRow[] = (expenses ?? []).map((e) => ({
    expenseId: e.expense_id,
    description: e.description,
    category: e.category,
    amount: Number(e.amount) || 0,
    expenseDate: e.expense_date,
    paymentMethod: e.payment_method,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Business health</h1>
        <p className="text-sm text-foreground/60">Trends, expenses, and insights.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Kpi label="Revenue (month)" value={fmtMoney(monthRevenue, currency)} accent="jade" />
        <Kpi label="Gross profit (month)" value={fmtMoney(monthGrossProfit, currency)} accent="jade" />
        <Kpi label="Expenses (month)" value={fmtMoney(monthExpenseTotal, currency)} accent="ruby" />
        <Kpi
          label="Net profit (month)"
          value={fmtMoney(netProfit, currency)}
          accent={netProfit >= 0 ? "jade" : "ruby"}
        />
      </div>

      <Card>
        <h2 className="font-medium mb-4">Revenue vs expenses — last 6 months</h2>
        <TrendChart data={buckets} currency={currency} />
      </Card>

      <ExpensesTable expenses={expenseRows} currency={currency} />
    </div>
  );
}

function Kpi({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "jade" | "ruby";
}) {
  const color = { jade: "text-jade-500", ruby: "text-ruby-500" }[accent];
  return (
    <Card>
      <p className="text-xs uppercase tracking-wide text-foreground/50">{label}</p>
      <p className={`font-display text-2xl mt-1 ${color}`}>{value}</p>
    </Card>
  );
}
