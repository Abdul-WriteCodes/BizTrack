"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Trash2, Plus, Minus } from "lucide-react";
import { Button, Input, Label, Card } from "@/components/ui/primitives";
import { fmtMoney } from "@/lib/format";
import { checkoutSale, type CartLine } from "../actions";

type ProductOption = {
  productId: string;
  productName: string;
  sellingPrice: number;
  costPrice: number;
  stockQuantity: number;
  baseUnit: string;
};

export default function CartBuilder({
  products,
  currency,
}: {
  products: ProductOption[];
  currency: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [payStatus, setPayStatus] = useState<"full" | "part" | "credit">("full");
  const [amountPaid, setAmountPaid] = useState(0);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return products.filter((p) => p.productName.toLowerCase().includes(q)).slice(0, 8);
  }, [query, products]);

  const grandTotal = cart.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);

  function addToCart(p: ProductOption) {
    setQuery("");
    setCart((c) => {
      const existing = c.find((l) => l.productId === p.productId);
      if (existing) {
        return c.map((l) =>
          l.productId === p.productId ? { ...l, quantity: l.quantity + 1 } : l
        );
      }
      return [
        ...c,
        {
          productId: p.productId,
          productName: p.productName,
          quantity: 1,
          defaultPrice: p.sellingPrice,
          unitPrice: p.sellingPrice,
          costPrice: p.costPrice,
        },
      ];
    });
  }

  function updateLine(productId: string, patch: Partial<CartLine>) {
    setCart((c) => c.map((l) => (l.productId === productId ? { ...l, ...patch } : l)));
  }

  function removeLine(productId: string) {
    setCart((c) => c.filter((l) => l.productId !== productId));
  }

  async function handleCheckout() {
    setError(null);
    setSuccess(null);
    if (cart.length === 0) {
      setError("Add at least one product to the cart.");
      return;
    }
    if (payStatus !== "full" && !customerName.trim()) {
      setError("A customer name is needed to track a partial or credit sale as a debt.");
      return;
    }
    setSaving(true);
    const result = await checkoutSale({
      cart,
      paymentMethod,
      payStatus,
      amountPaidOverride: payStatus === "part" ? amountPaid : undefined,
      customerName,
      customerPhone,
      note,
    });
    setSaving(false);
    if (!result.success) {
      setError(result.message ?? "Something went wrong.");
      return;
    }
    setSuccess("Sale recorded.");
    setCart([]);
    setCustomerName("");
    setCustomerPhone("");
    setNote("");
    setAmountPaid(0);
    setPayStatus("full");
    router.refresh();
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-3 space-y-4">
        <Card>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
            <Input
              placeholder="Search products to add…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          {results.length > 0 && (
            <ul className="mt-2 divide-y divide-border border border-border rounded-lg overflow-hidden">
              {results.map((p) => (
                <li key={p.productId}>
                  <button
                    onClick={() => addToCart(p)}
                    className="w-full text-left px-3 py-2 hover:bg-border/40 flex justify-between text-sm"
                  >
                    <span>{p.productName}</span>
                    <span className="text-foreground/50">
                      {fmtMoney(p.sellingPrice, currency)} · {p.stockQuantity} {p.baseUnit}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="font-medium mb-3">Cart</h2>
          {cart.length === 0 ? (
            <p className="text-sm text-foreground/60">No items yet — search above to add products.</p>
          ) : (
            <ul className="divide-y divide-border">
              {cart.map((line) => (
                <li key={line.productId} className="py-3 space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-medium">{line.productName}</span>
                    <button
                      onClick={() => removeLine(line.productId)}
                      className="text-ruby-500 p-1 -m-1"
                      aria-label={`Remove ${line.productName}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => updateLine(line.productId, { quantity: Math.max(1, line.quantity - 1) })}
                        className="p-1 rounded border border-border"
                      >
                        <Minus size={12} />
                      </button>
                      <Input
                        type="number"
                        min={1}
                        value={line.quantity}
                        onChange={(e) => updateLine(line.productId, { quantity: Math.max(1, Number(e.target.value)) })}
                        className="w-16 text-center py-1.5"
                      />
                      <button
                        type="button"
                        onClick={() => updateLine(line.productId, { quantity: line.quantity + 1 })}
                        className="p-1 rounded border border-border"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-foreground/60">
                      <span>@</span>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={line.unitPrice}
                        onChange={(e) => updateLine(line.productId, { unitPrice: Number(e.target.value) })}
                        className="w-28 py-1.5"
                      />
                      {line.unitPrice < line.defaultPrice && (
                        <span className="text-brass-600 text-xs">negotiated</span>
                      )}
                    </div>
                    <span className="ml-auto text-sm font-medium">
                      {fmtMoney(line.unitPrice * line.quantity, currency)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="lg:col-span-2 space-y-4">
        <Card>
          <h2 className="font-medium mb-3">Checkout</h2>
          <div className="space-y-3">
            <div>
              <Label>Payment method</Label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brass-400"
              >
                <option>Cash</option>
                <option>Bank Transfer</option>
                <option>POS</option>
                <option>Mobile Money</option>
              </select>
            </div>

            <div>
              <Label>Payment status</Label>
              <div className="flex gap-2">
                {(["full", "part", "credit"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setPayStatus(s)}
                    className={
                      "flex-1 rounded-lg border px-3 py-2 text-sm capitalize " +
                      (payStatus === s
                        ? "border-brass-500 bg-brass-500/10 text-brass-600"
                        : "border-border text-foreground/60")
                    }
                  >
                    {s === "part" ? "Partial" : s}
                  </button>
                ))}
              </div>
            </div>

            {payStatus === "part" && (
              <div>
                <Label>Amount paid now</Label>
                <Input
                  type="number"
                  min={0}
                  max={grandTotal}
                  step="0.01"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(Number(e.target.value))}
                />
              </div>
            )}

            {payStatus !== "full" && (
              <>
                <div>
                  <Label>Customer name</Label>
                  <Input required value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                </div>
                <div>
                  <Label>Customer phone (optional)</Label>
                  <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                </div>
              </>
            )}

            {payStatus === "full" && (
              <div>
                <Label>Customer name (optional)</Label>
                <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
              </div>
            )}

            <div>
              <Label>Note (optional)</Label>
              <Input value={note} onChange={(e) => setNote(e.target.value)} />
            </div>

            <div className="border-t border-border pt-3 flex justify-between items-baseline">
              <span className="text-sm text-foreground/60">Total</span>
              <span className="font-display text-2xl">{fmtMoney(grandTotal, currency)}</span>
            </div>

            {error && <p className="text-sm text-ruby-500">{error}</p>}
            {success && <p className="text-sm text-jade-500">{success}</p>}

            <Button className="w-full" disabled={saving || cart.length === 0} onClick={handleCheckout}>
              {saving ? "Recording…" : "Complete sale"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
