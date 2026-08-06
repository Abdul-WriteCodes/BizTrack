"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { genId } from "@/lib/ids";
import { getPaymentPlan } from "@/lib/countries";

type ActionResult = { success: boolean; message?: string };

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("users")
    .select("role")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  return data?.role === "admin";
}

export async function activateUser(userId: string): Promise<ActionResult> {
  const supabase = await createClient();
  if (!(await requireAdmin(supabase))) return { success: false, message: "Admin only." };

  const { data: target } = await supabase
    .from("users")
    .select("user_id, business_name, email, plan_type, country_code, currency_code")
    .eq("user_id", userId)
    .maybeSingle();
  if (!target) return { success: false, message: "User not found." };

  const days = target.plan_type === "yearly" ? 365 : 30;
  const start = new Date();
  const end = new Date(start.getTime() + days * 86400000);

  const { error: updateErr } = await supabase
    .from("users")
    .update({
      plan_status: "active",
      subscription_start: start.toISOString().slice(0, 10),
      subscription_end: end.toISOString().slice(0, 10),
    })
    .eq("user_id", userId);
  if (updateErr) return { success: false, message: updateErr.message };

  const plan = getPaymentPlan(target.country_code);
  const amount = target.plan_type === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;

  await supabase.from("payments").insert({
    payment_id: genId("PAY"),
    user_id: target.user_id,
    business_name: target.business_name,
    email: target.email,
    plan_type: target.plan_type,
    amount,
    currency_code: target.currency_code || "NGN",
    payment_date: new Date().toISOString(),
    note: "Initial activation",
  });

  revalidatePath("/admin");
  return { success: true };
}

export async function confirmRenewal(userId: string): Promise<ActionResult> {
  const supabase = await createClient();
  if (!(await requireAdmin(supabase))) return { success: false, message: "Admin only." };

  const { data: target } = await supabase
    .from("users")
    .select(
      "user_id, business_name, email, subscription_end, renewal_requested_plan, plan_type, country_code, currency_code"
    )
    .eq("user_id", userId)
    .maybeSingle();
  if (!target) return { success: false, message: "User not found." };

  const reqPlan = target.renewal_requested_plan || target.plan_type || "monthly";
  const extDays = reqPlan === "yearly" ? 365 : 30;
  const currentEnd = target.subscription_end ? new Date(target.subscription_end) : null;
  const base = currentEnd && currentEnd > new Date() ? currentEnd : new Date();
  const newEnd = new Date(base.getTime() + extDays * 86400000);

  const { error: updateErr } = await supabase
    .from("users")
    .update({
      subscription_end: newEnd.toISOString().slice(0, 10),
      plan_type: reqPlan,
      plan_status: "active",
      renewal_requested: false,
      renewal_requested_plan: null,
      renewal_requested_at: null,
    })
    .eq("user_id", userId);
  if (updateErr) return { success: false, message: updateErr.message };

  const plan = getPaymentPlan(target.country_code);
  const amount = reqPlan === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;

  await supabase.from("payments").insert({
    payment_id: genId("PAY"),
    user_id: target.user_id,
    business_name: target.business_name,
    email: target.email,
    plan_type: reqPlan,
    amount,
    currency_code: target.currency_code || "NGN",
    payment_date: new Date().toISOString(),
    note: "Renewal",
  });

  revalidatePath("/admin");
  return { success: true };
}

export async function deactivateUser(userId: string): Promise<ActionResult> {
  const supabase = await createClient();
  if (!(await requireAdmin(supabase))) return { success: false, message: "Admin only." };

  // Matches the original exactly: deactivating just sets plan_status to
  // "expired" — the same state a naturally-lapsed subscription lands in.
  // There's no separate "suspended" state and no reason field.
  const { error } = await supabase
    .from("users")
    .update({ plan_status: "expired" })
    .eq("user_id", userId);
  if (error) return { success: false, message: error.message };

  revalidatePath("/admin");
  return { success: true };
}

export async function reactivateUser(userId: string, planType: "monthly" | "yearly"): Promise<ActionResult> {
  const supabase = await createClient();
  if (!(await requireAdmin(supabase))) return { success: false, message: "Admin only." };

  const { data: target } = await supabase
    .from("users")
    .select("user_id, business_name, email, country_code, currency_code")
    .eq("user_id", userId)
    .maybeSingle();
  if (!target) return { success: false, message: "User not found." };

  // Matches the original: reactivation is treated as a fresh paid term,
  // not a free unlock — new start date, new end date, and a logged
  // payment, same as activation.
  const days = planType === "yearly" ? 365 : 30;
  const start = new Date();
  const end = new Date(start.getTime() + days * 86400000);

  const { error: updateErr } = await supabase
    .from("users")
    .update({
      plan_status: "active",
      plan_type: planType,
      subscription_start: start.toISOString().slice(0, 10),
      subscription_end: end.toISOString().slice(0, 10),
    })
    .eq("user_id", userId);
  if (updateErr) return { success: false, message: updateErr.message };

  const plan = getPaymentPlan(target.country_code);
  const amount = planType === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;

  await supabase.from("payments").insert({
    payment_id: genId("PAY"),
    user_id: target.user_id,
    business_name: target.business_name,
    email: target.email,
    plan_type: planType,
    amount,
    currency_code: target.currency_code || "NGN",
    payment_date: new Date().toISOString(),
    note: "Reactivation",
  });

  revalidatePath("/admin");
  return { success: true };
}
