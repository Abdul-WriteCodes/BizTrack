import { createClient } from "@/lib/supabase/server";
import InventoryTabs from "@/components/layout/inventory-tabs";
import { Card } from "@/components/ui/primitives";
import RestockForm from "./restock-form";

export default async function RestockPage() {
  const supabase = await createClient();

  const [{ data: products }, { data: suppliers }, { data: log }] = await Promise.all([
    supabase
      .from("products")
      .select("product_id, product_name, stock_quantity, cost_price")
      .order("product_name", { ascending: true }),
    supabase.from("suppliers").select("supplier_id, name").order("name", { ascending: true }),
    supabase
      .from("restock_log")
      .select("restock_id, product_name, qty_added, qty_before, qty_after, supplier_name, restock_date, recorded_by")
      .order("restock_date", { ascending: false })
      .limit(30),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Inventory</h1>
        <p className="text-sm text-foreground/60">Products, restocks, and suppliers.</p>
      </div>
      <InventoryTabs />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RestockForm
          products={(products ?? []).map((p) => ({
            productId: p.product_id,
            productName: p.product_name,
            stockQuantity: Number(p.stock_quantity) || 0,
            costPrice: Number(p.cost_price) || 0,
          }))}
          suppliers={(suppliers ?? []).map((s) => ({ supplierId: s.supplier_id, name: s.name }))}
        />

        <Card>
          <h2 className="font-medium mb-3">Recent restocks</h2>
          {(log ?? []).length === 0 ? (
            <p className="text-sm text-foreground/60">No restocks recorded yet.</p>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {(log ?? []).map((r) => (
                <li key={r.restock_id} className="py-2.5">
                  <div className="flex justify-between">
                    <span className="font-medium">{r.product_name}</span>
                    <span className="text-jade-500">+{r.qty_added}</span>
                  </div>
                  <p className="text-xs text-foreground/50 mt-0.5">
                    {r.qty_before} → {r.qty_after}
                    {r.supplier_name ? ` · ${r.supplier_name}` : ""} ·{" "}
                    {new Date(r.restock_date).toLocaleDateString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
