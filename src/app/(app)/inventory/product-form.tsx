"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label } from "@/components/ui/primitives";
import Modal from "@/components/ui/modal";
import { addProduct, updateProduct, type ProductInput } from "./actions";
import { fmtMoney } from "@/lib/format";

type ExistingProduct = ProductInput & { productId: string };

export default function ProductForm({
  currency,
  existing,
  onClose,
}: {
  currency: string;
  existing?: ExistingProduct;
  onClose: () => void;
}) {
  const router = useRouter();
  const [form, setForm] = useState<ProductInput>(
    existing ?? {
      productName: "",
      category: "",
      costPrice: 0,
      sellingPrice: 0,
      sellingPriceSub: 0,
      stockQuantity: 0,
      reorderLevel: 5,
      baseUnit: "unit",
      subUnit: "unit",
      unitsPerPack: 1,
      mfgDate: null,
      expiryDate: null,
    }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof ProductInput>(key: K, value: ProductInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const margin = form.sellingPrice - form.costPrice;
  const marginPct = form.sellingPrice > 0 ? (margin / form.sellingPrice) * 100 : 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const result = existing
      ? await updateProduct(existing.productId, form)
      : await addProduct(form);
    setSaving(false);
    if (!result.success) {
      setError(result.message ?? "Something went wrong.");
      return;
    }
    onClose();
    router.refresh();
  }

  return (
    <Modal title={existing ? "Edit product" : "Add product"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Product name</Label>
          <Input required value={form.productName} onChange={(e) => update("productName", e.target.value)} />
        </div>
        <div>
          <Label>Category</Label>
          <Input value={form.category} onChange={(e) => update("category", e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Cost price</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              required
              value={form.costPrice}
              onChange={(e) => update("costPrice", Number(e.target.value))}
            />
          </div>
          <div>
            <Label>Selling price</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              required
              value={form.sellingPrice}
              onChange={(e) => update("sellingPrice", Number(e.target.value))}
            />
          </div>
        </div>

        <p className="text-xs text-foreground/60">
          Margin: <span className={margin >= 0 ? "text-jade-500" : "text-ruby-500"}>
            {fmtMoney(margin, currency)} ({marginPct.toFixed(1)}%)
          </span>
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>{existing ? "Stock (edit via Restock)" : "Opening stock"}</Label>
            <Input
              type="number"
              min={0}
              disabled={!!existing}
              value={form.stockQuantity}
              onChange={(e) => update("stockQuantity", Number(e.target.value))}
            />
          </div>
          <div>
            <Label>Reorder level</Label>
            <Input
              type="number"
              min={0}
              value={form.reorderLevel}
              onChange={(e) => update("reorderLevel", Number(e.target.value))}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Base unit</Label>
            <Input value={form.baseUnit} onChange={(e) => update("baseUnit", e.target.value)} placeholder="carton" />
          </div>
          <div>
            <Label>Units per pack</Label>
            <Input
              type="number"
              min={1}
              value={form.unitsPerPack}
              onChange={(e) => update("unitsPerPack", Number(e.target.value))}
            />
          </div>
        </div>

        {error && <p className="text-sm text-ruby-500">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : existing ? "Save changes" : "Add product"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
