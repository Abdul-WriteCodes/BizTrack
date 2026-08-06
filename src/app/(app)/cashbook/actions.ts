"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { genId } from "@/lib/ids";

type ActionResult = { success: boolean; message?: string };

export type ManualEntryInput = {
  direction: "In" | "Out";
  amount: number;
  paymentMethod: string;
  entryDate: string; // yyyy-mm-dd
  note: string;
};

export async function addManualEntry(input: ManualEntryInput): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Not authenticated." };

  const { data: who } = await supabase
    .from("users")
    .select("business_id, full_name, email")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!who) return { success: false, message: "No business profile found." };

  if (input.amount <= 0 || !input.note.trim()) {
    return { success: false, message: "Enter a valid amount and a note." };
  }

  const { error } = await supabase.from("cashbook_entries").insert({
    entry_id: genId("CBK"),
    business_id: who.business_id,
    entry_date: new Date(input.entryDate).toISOString(),
    entry_type: "Manual",
    direction: input.direction,
    amount: Math.round(input.amount * 100) / 100,
    payment_method: input.paymentMethod,
    note: input.note.trim(),
    source_ref: null,
    recorded_by: who.full_name ?? who.email ?? "",
  });

  if (error) return { success: false, message: error.message };

  revalidatePath("/cashbook");
  revalidatePath("/dashboard");
  return { success: true };
}
