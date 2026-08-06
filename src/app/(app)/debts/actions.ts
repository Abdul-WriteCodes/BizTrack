"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { genId } from "@/lib/ids";

type ActionResult = { success: boolean; message?: string };

export type RecordPaymentInput = {
  debtId: string;
  amount: number;
  paymentMethod: string;
  note?: string;
};

export async function recordDebtPayment(input: RecordPaymentInput): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Not authenticated." };

  const { data: who } = await supabase
    .from("users")
    .select("business_id")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!who) return { success: false, message: "No business profile found." };

  if (input.amount <= 0) return { success: false, message: "Enter a valid amount." };

  const { data: debt, error: fetchErr } = await supabase
    .from("debts")
    .select("debt_id, total_amount, amount_paid")
    .eq("debt_id", input.debtId)
    .maybeSingle();
  if (fetchErr || !debt) return { success: false, message: "Debt record not found." };

  const newPaid = round2(Number(debt.amount_paid) + input.amount);
  const newBalance = round2(Math.max(Number(debt.total_amount) - newPaid, 0));
  const newStatus = newBalance <= 0 ? "settled" : "partial";
  const dpayId = genId("DPY");

  const { error: payErr } = await supabase.from("debt_payments").insert({
    dpay_id: dpayId,
    debt_id: input.debtId,
    business_id: who.business_id,
    amount: round2(input.amount),
    payment_date: new Date().toISOString(),
    note: input.note || "",
    payment_method: input.paymentMethod,
  });
  if (payErr) return { success: false, message: payErr.message };

  const { error: updateErr } = await supabase
    .from("debts")
    .update({ amount_paid: newPaid, balance: newBalance, status: newStatus })
    .eq("debt_id", input.debtId);
  if (updateErr) return { success: false, message: updateErr.message };

  await supabase.from("cashbook_entries").insert({
    entry_id: genId("CBK"),
    business_id: who.business_id,
    entry_date: new Date().toISOString(),
    entry_type: "Debt Collection",
    direction: "In",
    amount: round2(input.amount),
    payment_method: input.paymentMethod,
    note: input.note || "Debt collection",
    source_ref: dpayId,
    recorded_by: "",
  });

  revalidatePath("/debts");
  revalidatePath("/cashbook");
  revalidatePath("/dashboard");
  return { success: true };
}

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
