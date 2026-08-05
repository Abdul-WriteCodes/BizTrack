import SignOutButton from "@/components/layout/sign-out-button";
import { clsx } from "clsx";

export default function Topbar({
  businessName,
  fullName,
  planStatus,
  subscriptionEnd,
}: {
  businessName: string;
  fullName: string;
  planStatus: string;
  subscriptionEnd: string | null;
}) {
  return (
    <header className="flex items-center justify-between border-b border-border bg-surface px-4 md:px-8 py-4">
      <div>
        <p className="font-medium leading-tight">{businessName}</p>
        <p className="text-xs text-foreground/60">{fullName}</p>
      </div>
      <div className="flex items-center gap-4">
        <span
          className={clsx(
            "text-xs px-2.5 py-1 rounded-full font-medium",
            planStatus === "active" && "bg-jade-500/15 text-jade-500",
            planStatus === "pending_payment" && "bg-brass-500/15 text-brass-600",
            planStatus !== "active" && planStatus !== "pending_payment" && "bg-ruby-500/15 text-ruby-500"
          )}
        >
          {planStatus === "active" && subscriptionEnd
            ? `Active until ${subscriptionEnd}`
            : planStatus.replace("_", " ")}
        </span>
        <SignOutButton />
      </div>
    </header>
  );
}
