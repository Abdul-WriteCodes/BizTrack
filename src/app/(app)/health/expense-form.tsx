"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label } from "@/components/ui/primitives";
import Modal from "@/components/ui/modal";
import { addExpense } from "./actions";

const CATEGORIES = [
  "Rent",
  "Utilities",
  "Salaries",
  "Supplies",
  "Transport",
  "Marketing",
  "Maintenance",
  "Taxes",
  "Miscellaneous",
];

export default function ExpenseForm({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [amount, setAmount] = useState(0);
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const result = await addExpense({ description, category, amount, expenseDate, paymentMethod });
    setSaving(false);
    if (!result.success) {
      setError(result.message ?? "Something went wrong.");
      return;
    }
    onClose();
    router.refresh();
  }

  return (
    <Modal title="Log an expense" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Description</Label>
          <Input
            required
            placeholder="e.g. Generator fuel"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Category</Label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brass-400"
            >
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
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
            <Input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} />
          </div>
          <div>
            <Label>Paid via</Label>
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

        {error && <p className="text-sm text-ruby-500">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? "Logging…" : "Log expense"}</Button>
        </div>
      </form>
    </Modal>
  );
}
