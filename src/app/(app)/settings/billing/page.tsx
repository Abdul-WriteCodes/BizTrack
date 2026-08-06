import { createClient } from "@/lib/supabase/server";
import { daysUntil } from "@/lib/format";
import PlanPanel from "./plan-panel";

export default async function BillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select(
      "plan_type, plan_status, subscription_end, country_code, currency_symbol, renewal_requested, renewal_requested_plan, renewal_requested_at"
    )
    .eq("auth_user_id", user!.id)
    .maybeSingle();

  const daysLeft = daysUntil(profile?.subscription_end ?? null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Billing</h1>
        <p className="text-sm text-foreground/60">Plan, trial status, and payment.</p>
      </div>

      <PlanPanel
        planType={profile?.plan_type ?? "monthly"}
        planStatus={profile?.plan_status ?? "active"}
        subscriptionEnd={profile?.subscription_end ?? null}
        daysLeft={daysLeft}
        countryCode={profile?.country_code ?? null}
        currency={profile?.currency_symbol ?? "₦"}
        renewalRequested={!!profile?.renewal_requested}
        renewalRequestedPlan={profile?.renewal_requested_plan ?? null}
        renewalRequestedAt={profile?.renewal_requested_at ?? null}
      />
    </div>
  );
}
