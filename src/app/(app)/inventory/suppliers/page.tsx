import { createClient } from "@/lib/supabase/server";
import InventoryTabs from "@/components/layout/inventory-tabs";
import SuppliersTable, { type SupplierRow } from "./suppliers-table";

export default async function SuppliersPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("suppliers")
    .select("supplier_id, name, phone, notes")
    .order("name", { ascending: true });

  const suppliers: SupplierRow[] = (data ?? []).map((s) => ({
    supplierId: s.supplier_id,
    name: s.name,
    phone: s.phone ?? "",
    notes: s.notes ?? "",
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Inventory</h1>
        <p className="text-sm text-foreground/60">Products, restocks, and suppliers.</p>
      </div>
      <InventoryTabs />
      <SuppliersTable suppliers={suppliers} />
    </div>
  );
}
