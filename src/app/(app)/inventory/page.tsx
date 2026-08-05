import { createClient } from "@/lib/supabase/server";
import InventoryTabs from "@/components/layout/inventory-tabs";
import ProductsTable, { type ProductRow } from "./products-table";

export default async function InventoryPage() {
  const supabase = await createClient();

  const { data: profile } = await supabase.from("users").select("currency_symbol").single();
  const currency = profile?.currency_symbol ?? "₦";

  const { data } = await supabase
    .from("products")
    .select(
      "product_id, product_name, category, cost_price, selling_price, selling_price_sub, stock_quantity, reorder_level, base_unit, sub_unit, units_per_pack, mfg_date, expiry_date"
    )
    .order("product_name", { ascending: true });

  const products: ProductRow[] = (data ?? []).map((p) => ({
    productId: p.product_id,
    productName: p.product_name,
    category: p.category ?? "",
    costPrice: Number(p.cost_price) || 0,
    sellingPrice: Number(p.selling_price) || 0,
    sellingPriceSub: Number(p.selling_price_sub) || 0,
    stockQuantity: Number(p.stock_quantity) || 0,
    reorderLevel: Number(p.reorder_level) || 0,
    baseUnit: p.base_unit ?? "unit",
    subUnit: p.sub_unit ?? "unit",
    unitsPerPack: Number(p.units_per_pack) || 1,
    mfgDate: p.mfg_date,
    expiryDate: p.expiry_date,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Inventory</h1>
        <p className="text-sm text-foreground/60">Products, restocks, and suppliers.</p>
      </div>
      <InventoryTabs />
      <ProductsTable products={products} currency={currency} />
    </div>
  );
}
