"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Search } from "lucide-react";
import { Button, Input } from "@/components/ui/primitives";
import { fmtMoney } from "@/lib/format";
import { deleteProduct, type ProductInput } from "./actions";
import ProductForm from "./product-form";

export type ProductRow = ProductInput & { productId: string };

export default function ProductsTable({
  products,
  currency,
}: {
  products: ProductRow[];
  currency: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<ProductRow | null | "new">(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.productName.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    );
  }, [products, query]);

  async function handleDelete(productId: string) {
    if (!confirm("Delete this product? This can't be undone.")) return;
    setDeletingId(productId);
    await deleteProduct(productId);
    setDeletingId(null);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative max-w-xs w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
          <Input
            placeholder="Search products…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setEditing("new")}>Add product</Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-paper-100 dark:bg-ink-800 text-left text-foreground/60">
            <tr>
              <th className="px-4 py-2.5 font-medium">Product</th>
              <th className="px-4 py-2.5 font-medium">Category</th>
              <th className="px-4 py-2.5 font-medium text-right">Cost</th>
              <th className="px-4 py-2.5 font-medium text-right">Price</th>
              <th className="px-4 py-2.5 font-medium text-right">Stock</th>
              <th className="px-4 py-2.5 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((p) => {
              const low = p.stockQuantity <= p.reorderLevel;
              return (
                <tr key={p.productId}>
                  <td className="px-4 py-2.5">{p.productName}</td>
                  <td className="px-4 py-2.5 text-foreground/60">{p.category || "—"}</td>
                  <td className="px-4 py-2.5 text-right">{fmtMoney(p.costPrice, currency)}</td>
                  <td className="px-4 py-2.5 text-right">{fmtMoney(p.sellingPrice, currency)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <span className={low ? "text-ruby-500 font-medium" : ""}>
                      {p.stockQuantity} {p.baseUnit}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => setEditing(p)}
                        className="p-1.5 rounded-md hover:bg-border/60 text-foreground/60"
                        aria-label={`Edit ${p.productName}`}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(p.productId)}
                        disabled={deletingId === p.productId}
                        className="p-1.5 rounded-md hover:bg-border/60 text-ruby-500"
                        aria-label={`Delete ${p.productName}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-foreground/50">
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing === "new" && (
        <ProductForm currency={currency} onClose={() => setEditing(null)} />
      )}
      {editing && editing !== "new" && (
        <ProductForm currency={currency} existing={editing} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}
