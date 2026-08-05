"use server";

import { createClient } from "@/lib/supabase/server";
import { SUPPORTED_COUNTRIES, TRIAL_DAYS } from "@/lib/countries";

function genId(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

export type CreateBusinessInput = {
  businessName: string;
  fullName: string;
  email: string;
  phone: string;
  planType: "trial" | "monthly" | "yearly";
  country: string;
};

export async function createBusinessProfile(input: CreateBusinessInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Not authenticated." };
  }

  const countryData = SUPPORTED_COUNTRIES[input.country] ?? SUPPORTED_COUNTRIES["Nigeria"];
  const now = new Date();
  const isTrial = input.planType === "trial";

  const row = {
    user_id: genId("USR"),
    business_id: genId("BIZ"),
    business_name: input.businessName,
    full_name: input.fullName,
    email: input.email,
    phone: input.phone,
    country: input.country,
    country_code: countryData.code,
    currency_symbol: countryData.currencySymbol,
    currency_code: countryData.currencyCode,
    dial_code: countryData.dialCode,
    role: "owner",
    plan_type: input.planType,
    plan_status: isTrial ? "active" : "pending_payment",
    subscription_start: isTrial ? now.toISOString().slice(0, 10) : null,
    subscription_end: isTrial
      ? new Date(now.getTime() + TRIAL_DAYS * 86400000).toISOString().slice(0, 10)
      : null,
    created_at: now.toISOString(),
    password_reset_requested: "no",
    must_change_password: "no",
    auth_user_id: user.id,
    // legacy `password_hash` column stays NULL for accounts created
    // through the new app — it's only ever populated for the old
    // Streamlit signups, and login no longer reads it for these rows.
  };

  const { error } = await supabase.from("users").insert(row);

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true, message: "Account created." };
}
