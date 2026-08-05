"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { genId } from "@/lib/ids";

type ActionResult = { success: boolean; message?: string };

async function getBusinessId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("users")
    .select("business_id, full_name, email")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  return data;
}

// ── Products ────────────────────────────────────────────────────────────

export type ProductInput = {
  productName: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  sellingPriceSub?: number;
  stockQuantity: number;
  reorderLevel: number;
  baseUnit: string;
  subUnit: string;
  unitsPerPack: number;
  mfgDate?: string | null;
  expiryDate?: string | null;
};

export async function addProduct(input: ProductInput): Promise<ActionResult> {
  const supabase = await createClient();
  const who = await getBusinessId(supabase);
  if (!who) return { success: false, message: "Not authenticated." };

  const { error } = await supabase.from("products").insert({
    product_id: genId("PRD"),
    business_id: who.business_id,
    product_name: input.productName.trim(),
    category: input.category.trim(),
    cost_price: input.costPrice,
    selling_price: input.sellingPrice,
    selling_price_sub: input.sellingPriceSub ?? 0,
    stock_quantity: input.stockQuantity,
    reorder_level: input.reorderLevel,
    base_unit: input.baseUnit.trim() || "unit",
    sub_unit: input.subUnit.trim() || "unit",
    units_per_pack: input.unitsPerPack || 1,
    mfg_date: input.mfgDate || null,
    expiry_date: input.expiryDate || null,
    created_at: new Date().toISOString(),
  });

  if (error) return { success: false, message: error.message };

  // Opening stock is funded the same way a restock delivery is — mirror
  // the acquisition cost as a cash outflow so the cashbook balance isn't
  // inflated when this stock is later sold.
  if (input.stockQuantity > 0 && input.costPrice > 0) {
    const openingCost = Math.round(input.stockQuantity * input.costPrice * 100) / 100;
    await supabase.from("cashbook_entries").insert({
      entry_id: genId("CBK"),
      business_id: who.business_id,
      entry_date: new Date().toISOString(),
      entry_type: "restock",
      direction: "Out",
      amount: openingCost,
      payment_method: "Cash",
      note: `Opening stock — ${input.productName.trim()}`,
      source_ref: null,
      recorded_by: who.full_name ?? who.email ?? "",
    });
  }

  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateProduct(
  productId: string,
  input: ProductInput
): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("products")
    .update({
      product_name: input.productName.trim(),
      category: input.category.trim(),
      cost_price: input.costPrice,
      selling_price: input.sellingPrice,
      selling_price_sub: input.sellingPriceSub ?? 0,
      reorder_level: input.reorderLevel,
      base_unit: input.baseUnit.trim() || "unit",
      sub_unit: input.subUnit.trim() || "unit",
      units_per_pack: input.unitsPerPack || 1,
      mfg_date: input.mfgDate || null,
      expiry_date: input.expiryDate || null,
    })
    .eq("product_id", productId);

  if (error) return { success: false, message: error.message };

  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteProduct(productId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("product_id", productId);
  if (error) return { success: false, message: error.message };
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  return { success: true };
}

// ── Restock ─────────────────────────────────────────────────────────────

export type RestockInput = {
  productId: string;
  productName: string;
  qtyBefore: number;
  qtyAdded: number;
  supplierId?: string | null;
  supplierName?: string | null;
  note?: string;
  paymentMethod: string;
  unitCost?: number;
};

export async function restockProduct(input: RestockInput): Promise<ActionResult> {
  const supabase = await createClient();
  const who = await getBusinessId(supabase);
  if (!who) return { success: false, message: "Not authenticated." };

  const qtyAfter = input.qtyBefore + input.qtyAdded;

  const { error: updateErr } = await supabase
    .from("products")
    .update({ stock_quantity: qtyAfter })
    .eq("product_id", input.productId);
  if (updateErr) return { success: false, message: updateErr.message };

  const { error: logErr } = await supabase.from("restock_log").insert({
    restock_id: genId("RST"),
    business_id: who.business_id,
    product_id: input.productId,
    product_name: input.productName,
    qty_added: input.qtyAdded,
    qty_before: input.qtyBefore,
    qty_after: qtyAfter,
    supplier_id: input.supplierId || null,
    supplier_name: input.supplierName || null,
    note: input.note || "",
    recorded_by: who.full_name ?? who.email ?? "",
    restock_date: new Date().toISOString(),
    entry_type: "delivery",
    payment_method: input.paymentMethod,
  });
  if (logErr) return { success: false, message: logErr.message };

  if (input.unitCost && input.unitCost > 0) {
    const cost = Math.round(input.qtyAdded * input.unitCost * 100) / 100;
    await supabase.from("cashbook_entries").insert({
      entry_id: genId("CBK"),
      business_id: who.business_id,
      entry_date: new Date().toISOString(),
      entry_type: "restock",
      direction: "Out",
      amount: cost,
      payment_method: input.paymentMethod,
      note: `Restock — ${input.productName}`,
      source_ref: null,
      recorded_by: who.full_name ?? who.email ?? "",
    });
  }

  revalidatePath("/inventory");
  revalidatePath("/inventory/restock");
  revalidatePath("/dashboard");
  return { success: true };
}

// ── Suppliers ───────────────────────────────────────────────────────────

export type SupplierInput = { name: string; phone: string; notes?: string };

export async function addSupplier(input: SupplierInput): Promise<ActionResult> {
  const supabase = await createClient();
  const who = await getBusinessId(supabase);
  if (!who) return { success: false, message: "Not authenticated." };

  const { error } = await supabase.from("suppliers").insert({
    supplier_id: genId("SUP"),
    business_id: who.business_id,
    name: input.name.trim(),
    phone: input.phone.trim(),
    notes: input.notes?.trim() || "",
    created_at: new Date().toISOString(),
  });
  if (error) return { success: false, message: error.message };
  revalidatePath("/inventory/suppliers");
  return { success: true };
}

export async function updateSupplier(
  supplierId: string,
  input: SupplierInput
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("suppliers")
    .update({ name: input.name.trim(), phone: input.phone.trim(), notes: input.notes?.trim() || "" })
    .eq("supplier_id", supplierId);
  if (error) return { success: false, message: error.message };
  revalidatePath("/inventory/suppliers");
  return { success: true };
}

export async function deleteSupplier(supplierId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("suppliers").delete().eq("supplier_id", supplierId);
  if (error) return { success: false, message: error.message };
  revalidatePath("/inventory/suppliers");
  return { success: true };
}
