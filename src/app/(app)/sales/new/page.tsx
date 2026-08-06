import { createClient } from "@/lib/supabase/server";
import SalesTabs from "@/components/layout/sales-tabs";
import CartBuilder from "./cart-builder";

export default async function NewSalePage() {
  const supabase = await createClient();

  const { data: profile } = await supabase.from("users").select("currency_symbol").single();
  const currency = profile?.currency_symbol ?? "₦";

  const { data } = await supabase
    .from("products")
    .select("product_id, product_name, selling_price, cost_price, stock_quantity, base_unit")
    .gt("stock_quantity", 0)
    .order("product_name", { ascending: true });

  const products = (data ?? []).map((p) => ({
    productId: p.product_id,
    productName: p.product_name,
    sellingPrice: Number(p.selling_price) || 0,
    costPrice: Number(p.cost_price) || 0,
    stockQuantity: Number(p.stock_quantity) || 0,
    baseUnit: p.base_unit ?? "unit",
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Sales</h1>
        <p className="text-sm text-foreground/60">Cart, receipts, sales history, and void.</p>
      </div>
      <SalesTabs />
      <CartBuilder products={products} currency={currency} />
    </div>
  );
}
