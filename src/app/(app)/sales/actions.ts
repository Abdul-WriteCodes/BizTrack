"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { genId } from "@/lib/ids";

type ActionResult = { success: boolean; message?: string; saleId?: string };

async function getWho(supabase: Awaited<ReturnType<typeof createClient>>) {
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

export type CartLine = {
  productId: string;
  productName: string;
  quantity: number;
  defaultPrice: number;
  unitPrice: number; // possibly negotiated
  costPrice: number;
};

export type CheckoutInput = {
  cart: CartLine[];
  paymentMethod: string;
  payStatus: "full" | "part" | "credit";
  amountPaidOverride?: number; // only used when payStatus === "part"
  customerName: string;
  customerPhone?: string;
  note?: string;
};

export async function checkoutSale(input: CheckoutInput): Promise<ActionResult> {
  const supabase = await createClient();
  const who = await getWho(supabase);
  if (!who) return { success: false, message: "Not authenticated." };
  if (input.cart.length === 0) return { success: false, message: "Cart is empty." };

  // Pre-commit stock guard — re-check live stock right before writing so a
  // concurrent sale on another device can't push a product negative.
  const { data: liveProducts } = await supabase
    .from("products")
    .select("product_id, stock_quantity")
    .in("product_id", input.cart.map((c) => c.productId));

  for (const line of input.cart) {
    const live = liveProducts?.find((p) => p.product_id === line.productId);
    if (!live || Number(live.stock_quantity) < line.quantity) {
      return {
        success: false,
        message: `Not enough stock for ${line.productName} — only ${live?.stock_quantity ?? 0} left.`,
      };
    }
  }

  const saleId = genId("SAL");
  const saleTime = new Date().toISOString();

  const grandTotal = input.cart.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  const totalCost = input.cart.reduce((sum, l) => sum + l.costPrice * l.quantity, 0);
  const totalDiscount = input.cart.reduce(
    (sum, l) => sum + Math.max(0, (l.defaultPrice - l.unitPrice) * l.quantity),
    0
  );
  const totalProfit = grandTotal - totalCost;

  const paidNow =
    input.payStatus === "credit"
      ? 0
      : input.payStatus === "part"
      ? Math.max(0, Math.min(input.amountPaidOverride ?? 0, grandTotal))
      : grandTotal;

  const { error: saleErr } = await supabase.from("sales").insert({
    sale_id: saleId,
    business_id: who.business_id,
    product_id: input.cart[0].productId,
    product_name: input.cart.map((l) => l.productName).join(", "),
    quantity: input.cart.reduce((sum, l) => sum + l.quantity, 0),
    unit_price: input.cart[0].unitPrice,
    total_amount: round2(grandTotal),
    amount_paid: round2(paidNow),
    payment_status: input.payStatus,
    cost_total: round2(totalCost),
    gross_profit: round2(totalProfit),
    payment_method: input.paymentMethod,
    sale_date: saleTime,
    customer_name: input.customerName.trim(),
    discount_total: round2(totalDiscount),
    item_count: input.cart.length,
  });
  if (saleErr) return { success: false, message: saleErr.message };

  const items = input.cart.map((l) => ({
    item_id: genId("ITM"),
    sale_id: saleId,
    business_id: who.business_id,
    product_id: l.productId,
    product_name: l.productName,
    quantity: l.quantity,
    unit_price: l.unitPrice,
    discount_pct: 0,
    discount_amt: round2(Math.max(0, (l.defaultPrice - l.unitPrice) * l.quantity)),
    line_total: round2(l.unitPrice * l.quantity),
    cost_total: round2(l.costPrice * l.quantity),
    gross_profit: round2((l.unitPrice - l.costPrice) * l.quantity),
    stock_deduct: l.quantity,
    sell_mode: "base",
  }));
  const { error: itemsErr } = await supabase.from("sale_items").insert(items);
  if (itemsErr) return { success: false, message: itemsErr.message };

  // Deduct stock per line.
  for (const line of input.cart) {
    const live = liveProducts!.find((p) => p.product_id === line.productId)!;
    await supabase
      .from("products")
      .update({ stock_quantity: Number(live.stock_quantity) - line.quantity })
      .eq("product_id", line.productId);
  }

  // Debt, if not fully paid — a credit balance isn't cash until collected.
  if (input.payStatus !== "full") {
    const balance = round2(grandTotal - paidNow);
    await supabase.from("debts").insert({
      debt_id: genId("DBT"),
      business_id: who.business_id,
      sale_id: saleId,
      customer_name: input.customerName.trim(),
      customer_phone: input.customerPhone?.trim() || "",
      total_amount: round2(grandTotal),
      amount_paid: round2(paidNow),
      balance,
      sale_date: saleTime,
      status: input.payStatus === "part" ? "partial" : "unpaid",
      note: input.note?.trim() || "",
    });
  }

  // Cashbook mirror-write — only cash actually collected today counts as
  // "In"; a credit balance is recorded when it's later collected.
  if (paidNow > 0) {
    await supabase.from("cashbook_entries").insert({
      entry_id: genId("CBK"),
      business_id: who.business_id,
      entry_date: saleTime,
      entry_type: "Sale",
      direction: "In",
      amount: round2(paidNow),
      payment_method: input.paymentMethod,
      note: `Sale to ${input.customerName.trim() || "walk-in customer"}`,
      source_ref: saleId,
      recorded_by: who.full_name ?? who.email ?? "",
    });
  }

  revalidatePath("/sales");
  revalidatePath("/sales/history");
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  return { success: true, saleId };
}

export async function voidSale(saleId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: items } = await supabase
    .from("sale_items")
    .select("product_id, stock_deduct")
    .eq("sale_id", saleId);

  if (items && items.length > 0) {
    const { data: liveProducts } = await supabase
      .from("products")
      .select("product_id, stock_quantity")
      .in("product_id", items.map((i) => i.product_id));

    for (const item of items) {
      const live = liveProducts?.find((p) => p.product_id === item.product_id);
      if (live) {
        await supabase
          .from("products")
          .update({ stock_quantity: Number(live.stock_quantity) + Number(item.stock_deduct) })
          .eq("product_id", item.product_id);
      }
    }
  }

  await supabase.from("sale_items").delete().eq("sale_id", saleId);
  await supabase.from("cashbook_entries").delete().eq("source_ref", saleId);
  await supabase.from("debts").delete().eq("sale_id", saleId);
  const { error } = await supabase.from("sales").delete().eq("sale_id", saleId);
  if (error) return { success: false, message: error.message };

  revalidatePath("/sales");
  revalidatePath("/sales/history");
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  return { success: true };
}

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
