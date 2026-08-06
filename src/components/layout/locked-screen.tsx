import Link from "next/link";
import SignOutButton from "@/components/layout/sign-out-button";
import { Card, Button } from "@/components/ui/primitives";
import { getPaymentPlan } from "@/lib/countries";

export default function LockedScreen({
  kind,
  businessName,
  planType,
  countryCode,
  currency,
}: {
  kind: "pending" | "expired";
  businessName: string;
  planType: string;
  countryCode: string | null;
  currency: string;
}) {
  const plan = getPaymentPlan(countryCode ?? undefined);
  const isYearly = planType === "yearly";
  const amount = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
  const payLink = isYearly ? plan.flutterwaveYearly : plan.flutterwaveMonthly;

  const copy = {
    pending: {
      emoji: "🎉",
      title: "Almost there!",
      body: `Complete payment to activate ${businessName}. Once you've paid, an admin confirms it — usually within a few hours.`,
    },
    expired: {
      emoji: "⌛",
      title: "Subscription expired",
      body: `${businessName}'s subscription has ended. Renew to get back in.`,
    },
  }[kind];

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-950 px-4">
      <Card className="w-full max-w-md bg-ink-900 border-ink-700 text-center">
        <p className="text-4xl mb-2">{copy.emoji}</p>
        <h1 className="font-display text-2xl text-paper-50 mb-2">{copy.title}</h1>
        <p className="text-sm text-paper-200/70 mb-6">{copy.body}</p>

        <Link href={payLink} target="_blank" rel="noopener noreferrer">
          <Button className="w-full mb-3">
            Pay {currency}
            {amount.toLocaleString()} ({isYearly ? "yearly" : "monthly"})
          </Button>
        </Link>

        <div className="mt-2">
          <SignOutButton className="text-paper-200/80 border-ink-700 hover:bg-ink-800" />
        </div>
      </Card>
    </div>
  );
}
