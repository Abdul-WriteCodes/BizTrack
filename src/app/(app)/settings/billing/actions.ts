"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { success: boolean; message?: string };

export async function requestRenewal(planType: "monthly" | "yearly"): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Not authenticated." };

  const { error } = await supabase
    .from("users")
    .update({
      renewal_requested: true,
      renewal_requested_plan: planType,
      renewal_requested_at: new Date().toISOString(),
    })
    .eq("auth_user_id", user.id);
  if (error) return { success: false, message: error.message };

  revalidatePath("/settings/billing");
  return { success: true };
}

export async function cancelRenewalRequest(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Not authenticated." };

  const { error } = await supabase
    .from("users")
    .update({
      renewal_requested: false,
      renewal_requested_plan: null,
      renewal_requested_at: null,
    })
    .eq("auth_user_id", user.id);
  if (error) return { success: false, message: error.message };

  revalidatePath("/settings/billing");
  return { success: true };
}
