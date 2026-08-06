import Link from "next/link";
import SignOutButton from "@/components/layout/sign-out-button";
import { clsx } from "clsx";

export default function Topbar({
  businessName,
  fullName,
  planStatus,
  subscriptionEnd,
  daysLeft,
  isAdmin,
}: {
  businessName: string;
  fullName: string;
  planStatus: string;
  subscriptionEnd: string | null;
  daysLeft: number | null;
  isAdmin?: boolean;
}) {
  // Mirrors the original sidebar's expiry alert: red once 5 days or fewer
  // remain (or already lapsed), a calm green chip otherwise. Skipped for
  // admin accounts, same as the original.
  const showRenewAlert = !isAdmin && daysLeft !== null && daysLeft <= 5;

  return (
    <header className="border-b border-border bg-surface">
      <div className="flex items-center justify-between px-4 md:px-8 py-4">
        <div>
          <p className="font-medium leading-tight">{businessName}</p>
          <p className="text-xs text-foreground/60">{fullName}</p>
        </div>
        <div className="flex items-center gap-4">
          {!isAdmin && (
            <span
              className={clsx(
                "text-xs px-2.5 py-1 rounded-full font-medium",
                planStatus === "active" && !showRenewAlert && "bg-jade-500/15 text-jade-500",
                planStatus === "pending_payment" && "bg-brass-500/15 text-brass-600",
                (showRenewAlert || (planStatus !== "active" && planStatus !== "pending_payment")) &&
                  "bg-ruby-500/15 text-ruby-500"
              )}
            >
              {planStatus === "active" && subscriptionEnd
                ? `Active until ${subscriptionEnd}`
                : planStatus.replace("_", " ")}
            </span>
          )}
          <SignOutButton />
        </div>
      </div>

      {showRenewAlert && (
        <div className="px-4 md:px-8 pb-3 -mt-1">
          <div className="flex items-center justify-between gap-3 rounded-lg bg-ruby-500/10 border border-ruby-500/30 px-3.5 py-2.5">
            <p className="text-xs text-ruby-500">
              {daysLeft! < 0
                ? `Subscription expired ${Math.abs(daysLeft!)} day${Math.abs(daysLeft!) === 1 ? "" : "s"} ago — renew to restore access.`
                : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left — renew and keep tracking your business.`}
            </p>
            <Link
              href="/settings/billing"
              className="text-xs shrink-0 px-3 py-1.5 rounded-md bg-ruby-500 text-white font-medium"
            >
              Renew now
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
