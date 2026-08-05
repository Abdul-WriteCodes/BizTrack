import { Card } from "@/components/ui/primitives";

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Sales</h1>
        <p className="text-sm text-foreground/60">Cart, receipts, sales history, and void.</p>
      </div>
      <Card>
        <p className="text-sm text-foreground/60">
          This module is scaffolded and ready to build out next — routing, layout, and
          RLS-scoped Supabase access are already wired up.
        </p>
      </Card>
    </div>
  );
}
