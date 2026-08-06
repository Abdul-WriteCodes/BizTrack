"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { activateUser, confirmRenewal, deactivateUser, reactivateUser } from "./actions";

export function ActivateButton({ userId }: { userId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <button
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        const result = await activateUser(userId);
        setLoading(false);
        if (!result.success) alert(result.message ?? "Failed to activate.");
        router.refresh();
      }}
      className="text-xs px-3 py-1.5 rounded-md bg-jade-500 text-white disabled:opacity-50"
    >
      {loading ? "Activating…" : "Activate"}
    </button>
  );
}

export function ConfirmRenewalButton({ userId }: { userId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <button
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        const result = await confirmRenewal(userId);
        setLoading(false);
        if (!result.success) alert(result.message ?? "Failed to confirm renewal.");
        router.refresh();
      }}
      className="text-xs px-3 py-1.5 rounded-md bg-brass-500 text-ink-950 disabled:opacity-50"
    >
      {loading ? "Confirming…" : "Confirm renewal"}
    </button>
  );
}

export function DeactivateButton({ userId, businessName }: { userId: string; businessName: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <button
      disabled={loading}
      onClick={async () => {
        if (!confirm(`Deactivate ${businessName}? This sets them to expired — same as a lapsed subscription.`))
          return;
        setLoading(true);
        const result = await deactivateUser(userId);
        setLoading(false);
        if (!result.success) alert(result.message ?? "Failed to deactivate.");
        router.refresh();
      }}
      className="text-xs px-3 py-1.5 rounded-md border border-ruby-500 text-ruby-500 disabled:opacity-50"
    >
      {loading ? "Deactivating…" : "Deactivate"}
    </button>
  );
}

export function ReactivateButton({ userId, currentPlanType }: { userId: string; currentPlanType: string }) {
  const router = useRouter();
  const [plan, setPlan] = useState<"monthly" | "yearly">(currentPlanType === "yearly" ? "yearly" : "monthly");
  const [loading, setLoading] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <select
        value={plan}
        onChange={(e) => setPlan(e.target.value as "monthly" | "yearly")}
        className="text-xs rounded-md border border-border bg-surface px-2 py-1.5"
      >
        <option value="monthly">Monthly</option>
        <option value="yearly">Yearly</option>
      </select>
      <button
        disabled={loading}
        onClick={async () => {
          setLoading(true);
          const result = await reactivateUser(userId, plan);
          setLoading(false);
          if (!result.success) alert(result.message ?? "Failed to reactivate.");
          router.refresh();
        }}
        className="text-xs px-3 py-1.5 rounded-md bg-jade-500 text-white disabled:opacity-50"
      >
        {loading ? "Reactivating…" : `Reactivate (${plan === "yearly" ? "1 year" : "30 days"})`}
      </button>
    </div>
  );
}
