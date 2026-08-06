"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card } from "@/components/ui/primitives";
import { getPaymentPlan } from "@/lib/countries";
import { requestRenewal, cancelRenewalRequest } from "./actions";

type Props = {
  planType: string;
  planStatus: string;
  subscriptionEnd: string | null;
  daysLeft: number | null;
  countryCode: string | null;
  currency: string;
  renewalRequested: boolean;
  renewalRequestedPlan: string | null;
  renewalRequestedAt: string | null;
};

export default function PlanPanel({
  planType,
  planStatus,
  subscriptionEnd,
  daysLeft,
  countryCode,
  currency,
  renewalRequested,
  renewalRequestedPlan,
  renewalRequestedAt,
}: Props) {
  const router = useRouter();
  const plan = getPaymentPlan(countryCode ?? undefined);
  const [renewPlan, setRenewPlan] = useState<"monthly" | "yearly">(
    planType === "yearly" ? "yearly" : "monthly"
  );
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    const result = await requestRenewal(renewPlan);
    setLoading(false);
    if (!result.success) {
      alert(result.message ?? "Something went wrong.");
      return;
    }
    setConfirming(false);
    router.refresh();
  }

  async function handleCancel() {
    setLoading(true);
    await cancelRenewalRequest();
    setLoading(false);
    router.refresh();
  }

  return (
    <Card>
      <h2 className="font-medium mb-4">Plan &amp; renewal</h2>

      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <p className="text-foreground/50">Current plan</p>
          <p className="font-medium capitalize">
            {planType} ({planStatus.replace("_", " ")})
          </p>
        </div>
        {daysLeft !== null && (
          <div>
            <p className="text-foreground/50">Expires</p>
            <p className={`font-medium ${daysLeft < 0 ? "text-ruby-500" : ""}`}>
              {subscriptionEnd} ({daysLeft >= 0 ? `${daysLeft} day${daysLeft === 1 ? "" : "s"} left` : "expired"})
            </p>
          </div>
        )}
      </div>

      {renewalRequested ? (
        <div className="space-y-3">
          <p className="text-sm bg-brass-500/10 text-brass-600 rounded-lg px-3 py-2.5">
            Your renewal request ({renewalRequestedPlan}) is awaiting admin confirmation
            {renewalRequestedAt ? ` — requested ${new Date(renewalRequestedAt).toLocaleString()}` : ""}.
          </p>
          <p className="text-sm text-foreground/60">
            Haven&apos;t paid yet? Use the button below — it&apos;ll stay here until your renewal is confirmed.
          </p>
          <Link
            href={renewalRequestedPlan === "yearly" ? plan.flutterwaveYearly : plan.flutterwaveMonthly}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button className="w-full">
              Pay {(renewalRequestedPlan ?? "monthly") === "yearly" ? "Yearly" : "Monthly"} —{" "}
              {currency}
              {(renewalRequestedPlan === "yearly" ? plan.yearlyPrice : plan.monthlyPrice).toLocaleString()}
            </Button>
          </Link>
          <p className="text-xs text-foreground/50">Already paid? No action needed — your admin will confirm it shortly.</p>
          <button
            onClick={handleCancel}
            disabled={loading}
            className="text-xs text-foreground/50 hover:text-ruby-500 underline"
          >
            Made a mistake? Cancel this renewal request
          </button>
        </div>
      ) : !confirming ? (
        <div className="space-y-3">
          <select
            value={renewPlan}
            onChange={(e) => setRenewPlan(e.target.value as "monthly" | "yearly")}
            className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brass-400"
          >
            <option value="monthly">Monthly — {currency}{plan.monthlyPrice.toLocaleString()}</option>
            <option value="yearly">Yearly — {currency}{plan.yearlyPrice.toLocaleString()}</option>
          </select>
          <Button className="w-full" onClick={() => setConfirming(true)}>
            Renew plan — {currency}
            {(renewPlan === "yearly" ? plan.yearlyPrice : plan.monthlyPrice).toLocaleString()}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm bg-brass-500/10 text-brass-600 rounded-lg px-3 py-2.5">
            You&apos;re about to request a <strong>{renewPlan}</strong> renewal for{" "}
            {currency}
            {(renewPlan === "yearly" ? plan.yearlyPrice : plan.monthlyPrice).toLocaleString()}. This
            takes you to the payment page. Are you sure?
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
            <Button className="flex-1" disabled={loading} onClick={handleConfirm}>
              {loading ? "Confirming…" : "Yes, continue to payment"}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
