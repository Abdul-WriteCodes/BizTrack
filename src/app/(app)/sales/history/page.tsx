import { createClient } from "@/lib/supabase/server";
import SalesTabs from "@/components/layout/sales-tabs";
import { fmtMoney } from "@/lib/format";
import VoidButton from "./void-button";

export default async function SalesHistoryPage() {
  const supabase = await createClient();

  const { data: profile } = await supabase.from("users").select("currency_symbol").single();
  const currency = profile?.currency_symbol ?? "₦";

  const { data } = await supabase
    .from("sales")
    .select(
      "sale_id, product_name, customer_name, total_amount, amount_paid, payment_status, payment_method, sale_date, item_count"
    )
    .order("sale_date", { ascending: false })
    .limit(100);

  const sales = data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Sales</h1>
        <p className="text-sm text-foreground/60">Cart, receipts, sales history, and void.</p>
      </div>
      <SalesTabs />

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-paper-100 dark:bg-ink-800 text-left text-foreground/60">
            <tr>
              <th className="px-4 py-2.5 font-medium">Date</th>
              <th className="px-4 py-2.5 font-medium">Items</th>
              <th className="px-4 py-2.5 font-medium">Customer</th>
              <th className="px-4 py-2.5 font-medium">Method</th>
              <th className="px-4 py-2.5 font-medium text-right">Total</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sales.map((s) => (
              <tr key={s.sale_id}>
                <td className="px-4 py-2.5 whitespace-nowrap text-foreground/60">
                  {new Date(s.sale_date).toLocaleString()}
                </td>
                <td className="px-4 py-2.5" title={s.product_name}>
                  {s.item_count} item{s.item_count === 1 ? "" : "s"}
                </td>
                <td className="px-4 py-2.5">{s.customer_name || "Walk-in"}</td>
                <td className="px-4 py-2.5 text-foreground/60">{s.payment_method}</td>
                <td className="px-4 py-2.5 text-right">{fmtMoney(Number(s.total_amount), currency)}</td>
                <td className="px-4 py-2.5 capitalize">
                  <span
                    className={
                      s.payment_status === "full"
                        ? "text-jade-500"
                        : s.payment_status === "part"
                        ? "text-brass-600"
                        : "text-ruby-500"
                    }
                  >
                    {s.payment_status === "part" ? "partial" : s.payment_status}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <VoidButton saleId={s.sale_id} label={new Date(s.sale_date).toLocaleDateString()} />
                </td>
              </tr>
            ))}
            {sales.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-foreground/50">
                  No sales recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
