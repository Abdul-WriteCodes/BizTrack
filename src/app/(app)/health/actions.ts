"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { genId } from "@/lib/ids";

type ActionResult = { success: boolean; message?: string };

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

export type ExpenseInput = {
  description: string;
  category: string;
  amount: number;
  expenseDate: string; // yyyy-mm-dd
  paymentMethod: string;
};

export async function addExpense(input: ExpenseInput): Promise<ActionResult> {
  const supabase = await createClient();
  const who = await getWho(supabase);
  if (!who) return { success: false, message: "Not authenticated." };

  if (!input.description.trim() || input.amount <= 0) {
    return { success: false, message: "Enter a description and a valid amount." };
  }

  const expenseId = genId("EXP");
  const { error } = await supabase.from("expenses").insert({
    expense_id: expenseId,
    business_id: who.business_id,
    description: input.description.trim(),
    category: input.category,
    amount: round2(input.amount),
    expense_date: input.expenseDate,
    recorded_by: who.full_name ?? who.email ?? "",
    payment_method: input.paymentMethod,
  });
  if (error) return { success: false, message: error.message };

  await supabase.from("cashbook_entries").insert({
    entry_id: genId("CBK"),
    business_id: who.business_id,
    entry_date: input.expenseDate,
    entry_type: "Expense",
    direction: "Out",
    amount: round2(input.amount),
    payment_method: input.paymentMethod,
    note: input.description.trim(),
    source_ref: expenseId,
    recorded_by: who.full_name ?? who.email ?? "",
  });

  revalidatePath("/health");
  revalidatePath("/cashbook");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteExpense(expenseId: string): Promise<ActionResult> {
  const supabase = await createClient();
  await supabase.from("cashbook_entries").delete().eq("source_ref", expenseId);
  const { error } = await supabase.from("expenses").delete().eq("expense_id", expenseId);
  if (error) return { success: false, message: error.message };

  revalidatePath("/health");
  revalidatePath("/cashbook");
  revalidatePath("/dashboard");
  return { success: true };
}

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
