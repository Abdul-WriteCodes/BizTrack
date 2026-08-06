"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label } from "@/components/ui/primitives";
import Modal from "@/components/ui/modal";
import { fmtMoney } from "@/lib/format";
import { recordDebtPayment } from "./actions";

export default function PaymentForm({
  debtId,
  customerName,
  balance,
  currency,
  onClose,
}: {
  debtId: string;
  customerName: string;
  balance: number;
  currency: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState(balance);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const result = await recordDebtPayment({ debtId, amount, paymentMethod, note });
    setSaving(false);
    if (!result.success) {
      setError(result.message ?? "Something went wrong.");
      return;
    }
    onClose();
    router.refresh();
  }

  return (
    <Modal title={`Record payment — ${customerName || "Walk-in"}`} onClose={onClose}>
      <p className="text-xs text-foreground/60 mb-4">
        Balance outstanding: <span className="font-medium">{fmtMoney(balance, currency)}</span>
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Amount</Label>
          <Input
            type="number"
            min={0.01}
            max={balance}
            step="0.01"
            required
            value={amount || ""}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
        </div>
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
          <Label>Note (optional)</Label>
          <Input value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        {error && <p className="text-sm text-ruby-500">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving || amount <= 0}>
            {saving ? "Recording…" : "Record payment"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
