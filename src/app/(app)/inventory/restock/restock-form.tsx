"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, Card } from "@/components/ui/primitives";
import { restockProduct } from "../actions";

type ProductOption = { productId: string; productName: string; stockQuantity: number; costPrice: number };
type SupplierOption = { supplierId: string; name: string };

export default function RestockForm({
  products,
  suppliers,
}: {
  products: ProductOption[];
  suppliers: SupplierOption[];
}) {
  const router = useRouter();
  const [productId, setProductId] = useState("");
  const [qtyAdded, setQtyAdded] = useState(0);
  const [unitCost, setUnitCost] = useState(0);
  const [supplierId, setSupplierId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const selected = useMemo(() => products.find((p) => p.productId === productId), [products, productId]);
  const selectedSupplier = useMemo(() => suppliers.find((s) => s.supplierId === supplierId), [suppliers, supplierId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selected || qtyAdded <= 0) return;
    setError(null);
    setSuccess(false);
    setSaving(true);

    const result = await restockProduct({
      productId: selected.productId,
      productName: selected.productName,
      qtyBefore: selected.stockQuantity,
      qtyAdded,
      supplierId: selectedSupplier?.supplierId ?? null,
      supplierName: selectedSupplier?.name ?? null,
      note,
      paymentMethod,
      unitCost,
    });

    setSaving(false);
    if (!result.success) {
      setError(result.message ?? "Something went wrong.");
      return;
    }
    setSuccess(true);
    setQtyAdded(0);
    setUnitCost(0);
    setNote("");
    router.refresh();
  }

  return (
    <Card>
      <h2 className="font-medium mb-4">Restock a product</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Product</Label>
          <select
            required
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brass-400"
          >
            <option value="">Select a product…</option>
            {products.map((p) => (
              <option key={p.productId} value={p.productId}>
                {p.productName} — {p.stockQuantity} in stock
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Quantity added</Label>
            <Input
              type="number"
              min={1}
              required
              value={qtyAdded || ""}
              onChange={(e) => setQtyAdded(Number(e.target.value))}
            />
          </div>
          <div>
            <Label>Unit cost (optional)</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={unitCost || ""}
              onChange={(e) => setUnitCost(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Supplier (optional)</Label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brass-400"
            >
              <option value="">None</option>
              {suppliers.map((s) => (
                <option key={s.supplierId} value={s.supplierId}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Payment method</Label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brass-400"
            >
              <option>Cash</option>
              <option>Transfer</option>
              <option>Card</option>
            </select>
          </div>
        </div>

        <div>
          <Label>Note (optional)</Label>
          <Input value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        {error && <p className="text-sm text-ruby-500">{error}</p>}
        {success && <p className="text-sm text-jade-500">Restock recorded.</p>}

        <Button type="submit" disabled={saving || !productId || qtyAdded <= 0}>
          {saving ? "Saving…" : "Record restock"}
        </Button>
      </form>
    </Card>
  );
}
