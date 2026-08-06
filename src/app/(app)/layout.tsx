import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";
import LockedScreen from "@/components/layout/locked-screen";
import { daysUntil } from "@/lib/format";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select(
      "business_name, full_name, role, currency_symbol, plan_status, plan_type, subscription_end, country_code"
    )
    .eq("auth_user_id", user.id)
    .maybeSingle();

  const role = profile?.role ?? "owner";
  const isAdmin = role === "admin";
  let status = profile?.plan_status ?? "active";
  const daysLeft = daysUntil(profile?.subscription_end ?? null);

  // Mirrors the original app's check_access(): a lapsed subscription
  // auto-flips to "expired" the next time the owner loads the app. A
  // manual admin Deactivate lands in the same "expired" state — the
  // original doesn't distinguish the two, so neither do we.
  if (
    !isAdmin &&
    status === "active" &&
    profile?.subscription_end &&
    new Date(profile.subscription_end) < new Date()
  ) {
    await supabase.from("users").update({ plan_status: "expired" }).eq("auth_user_id", user.id);
    status = "expired";
  }

  if (!isAdmin && (status === "pending_payment" || status === "expired")) {
    return (
      <LockedScreen
        kind={status === "pending_payment" ? "pending" : "expired"}
        businessName={profile?.business_name ?? "Your business"}
        planType={profile?.plan_type ?? "monthly"}
        countryCode={profile?.country_code ?? null}
        currency={profile?.currency_symbol ?? "₦"}
      />
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar role={role} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          businessName={profile?.business_name ?? "Your business"}
          fullName={profile?.full_name ?? user.email ?? ""}
          planStatus={profile?.plan_status ?? "active"}
          subscriptionEnd={profile?.subscription_end ?? null}
          daysLeft={daysLeft}
          isAdmin={isAdmin}
        />
        <main className="flex-1 p-4 md:p-8 max-w-6xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
