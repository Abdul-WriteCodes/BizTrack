"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { voidSale } from "../actions";

export default function VoidButton({ saleId, label }: { saleId: string; label: string }) {
  const router = useRouter();
  const [voiding, setVoiding] = useState(false);

  async function handleVoid() {
    if (!confirm(`Void this sale (${label})? Stock will be restored and this can't be undone.`)) return;
    setVoiding(true);
    const result = await voidSale(saleId);
    setVoiding(false);
    if (!result.success) {
      alert(result.message ?? "Failed to void sale.");
      return;
    }
    router.refresh();
  }

  return (
    <button
      onClick={handleVoid}
      disabled={voiding}
      className="p-1.5 rounded-md hover:bg-border/60 text-ruby-500 disabled:opacity-50"
      aria-label={`Void sale ${label}`}
    >
      <Trash2 size={15} />
    </button>
  );
}
