import { Card } from "@/components/ui/primitives";

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Business health</h1>
        <p className="text-sm text-foreground/60">Trends, expenses, and insights.</p>
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
