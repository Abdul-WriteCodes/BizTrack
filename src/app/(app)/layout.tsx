import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("business_name, full_name, role, currency_symbol, plan_status, subscription_end")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar role={profile?.role ?? "owner"} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          businessName={profile?.business_name ?? "Your business"}
          fullName={profile?.full_name ?? user.email ?? ""}
          planStatus={profile?.plan_status ?? "active"}
          subscriptionEnd={profile?.subscription_end ?? null}
        />
        <main className="flex-1 p-4 md:p-8 max-w-6xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
