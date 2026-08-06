"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label } from "@/components/ui/primitives";
import Modal from "@/components/ui/modal";
import { addManualEntry } from "./actions";

export default function ManualEntryForm({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [direction, setDirection] = useState<"In" | "Out">("In");
  const [amount, setAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const result = await addManualEntry({ direction, amount, paymentMethod, entryDate, note });
    setSaving(false);
    if (!result.success) {
      setError(result.message ?? "Something went wrong.");
      return;
    }
    onClose();
    router.refresh();
  }

  return (
    <Modal title="Log a manual entry" onClose={onClose}>
      <p className="text-xs text-foreground/60 mb-4">
        For cash movements that aren&apos;t a sale, expense, restock, or debt collection —
        e.g. money you put into or took out of the business, or a bank deposit/withdrawal.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Direction</Label>
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value as "In" | "Out")}
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brass-400"
            >
              <option value="In">In</option>
              <option value="Out">Out</option>
            </select>
          </div>
          <div>
            <Label>Amount</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              required
              value={amount || ""}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Date</Label>
            <Input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
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
        </div>

        <div>
          <Label>Note</Label>
          <Input
            required
            placeholder="e.g. Owner drawing for personal use / Capital top-up"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-ruby-500">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? "Logging…" : "Log entry"}</Button>
        </div>
      </form>
    </Modal>
  );
}
