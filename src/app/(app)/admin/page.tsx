import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/primitives";
import {
  ActivateButton,
  ConfirmRenewalButton,
  DeactivateButton,
  ReactivateButton,
} from "./action-buttons";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("users")
    .select("role")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (me?.role !== "admin") redirect("/dashboard");

  const { data: users } = await supabase
    .from("users")
    .select(
      "user_id, business_name, full_name, email, phone, plan_type, plan_status, subscription_end, created_at, renewal_requested, renewal_requested_plan, renewal_requested_at"
    )
    .order("created_at", { ascending: false });

  const all = users ?? [];
  const pending = all.filter((u) => u.plan_status === "pending_payment");
  const renewals = all.filter((u) => u.renewal_requested);
  const active = all.filter((u) => u.plan_status === "active");
  // "expired" covers both a naturally-lapsed subscription and a manual
  // Deactivate — the original app doesn't distinguish the two either.
  const deactivated = all.filter((u) => u.plan_status === "expired");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Admin panel</h1>
        <p className="text-sm text-foreground/60">BizTrack platform management.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Kpi label="Total businesses" value={String(all.length)} />
        <Kpi label="Active subscriptions" value={String(active.length)} accent="jade" />
        <Kpi label="Pending activation" value={String(pending.length)} accent="brass" />
      </div>

      <Card>
        <h2 className="font-medium mb-3">Pending activation</h2>
        {pending.length === 0 ? (
          <p className="text-sm text-foreground/60">No pending activations.</p>
        ) : (
          <ul className="divide-y divide-border">
            {pending.map((u) => (
              <li key={u.user_id} className="py-3 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-sm font-medium">{u.business_name} — {u.full_name}</p>
                  <p className="text-xs text-foreground/50">
                    {u.email} · {u.phone || "—"} · Plan: {u.plan_type} · Signed up{" "}
                    {new Date(u.created_at).toLocaleDateString()}
                  </p>
                </div>
                <ActivateButton userId={u.user_id} />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h2 className="font-medium mb-3">Renewal requests</h2>
        {renewals.length === 0 ? (
          <p className="text-sm text-foreground/60">No pending renewal requests.</p>
        ) : (
          <ul className="divide-y divide-border">
            {renewals.map((u) => (
              <li key={u.user_id} className="py-3 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-sm font-medium">{u.business_name} — {u.full_name}</p>
                  <p className="text-xs text-foreground/50">
                    {u.email} · Current: {u.plan_type} (exp. {u.subscription_end || "—"}) · Requested:{" "}
                    {u.renewal_requested_plan || u.plan_type} · At{" "}
                    {u.renewal_requested_at ? new Date(u.renewal_requested_at).toLocaleString() : "—"}
                  </p>
                </div>
                <ConfirmRenewalButton userId={u.user_id} />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h2 className="font-medium mb-3">Active businesses</h2>
        {active.length === 0 ? (
          <p className="text-sm text-foreground/60">No active businesses.</p>
        ) : (
          <ul className="divide-y divide-border">
            {active.map((u) => (
              <li key={u.user_id} className="py-3 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-sm font-medium">{u.business_name} — {u.full_name}</p>
                  <p className="text-xs text-foreground/50">
                    {u.email} · Plan: {u.plan_type} · Expires {u.subscription_end || "—"}
                  </p>
                </div>
                <DeactivateButton userId={u.user_id} businessName={u.business_name} />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h2 className="font-medium mb-3">Deactivated</h2>
        {deactivated.length === 0 ? (
          <p className="text-sm text-foreground/60">No deactivated businesses.</p>
        ) : (
          <ul className="divide-y divide-border">
            {deactivated.map((u) => (
              <li key={u.user_id} className="py-3 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-sm font-medium">{u.business_name} — {u.full_name}</p>
                  <p className="text-xs text-foreground/50">
                    {u.email} · Plan: {u.plan_type} · Expired: {u.subscription_end || "—"}
                  </p>
                </div>
                <ReactivateButton userId={u.user_id} currentPlanType={u.plan_type} />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h2 className="font-medium mb-3">All businesses</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-foreground/60">
              <tr>
                <th className="py-2 font-medium">Business</th>
                <th className="py-2 font-medium">Email</th>
                <th className="py-2 font-medium">Plan</th>
                <th className="py-2 font-medium">Status</th>
                <th className="py-2 font-medium">Renews / expires</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {all.map((u) => (
                <tr key={u.user_id}>
                  <td className="py-2">{u.business_name}</td>
                  <td className="py-2 text-foreground/60">{u.email}</td>
                  <td className="py-2 capitalize">{u.plan_type}</td>
                  <td className="py-2 capitalize">
                    <span
                      className={
                        u.plan_status === "active"
                          ? "text-jade-500"
                          : u.plan_status === "pending_payment"
                          ? "text-brass-600"
                          : "text-ruby-500"
                      }
                    >
                      {u.plan_status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-2 text-foreground/60">{u.subscription_end || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string; accent?: "jade" | "brass" }) {
  const color = accent ? { jade: "text-jade-500", brass: "text-brass-500" }[accent] : "text-foreground";
  return (
    <Card>
      <p className="text-xs uppercase tracking-wide text-foreground/50">{label}</p>
      <p className={`font-display text-2xl mt-1 ${color}`}>{value}</p>
    </Card>
  );
}
