"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/primitives";
import { fmtMoney } from "@/lib/format";
import { deleteExpense } from "./actions";
import ExpenseForm from "./expense-form";

export type ExpenseRow = {
  expenseId: string;
  description: string;
  category: string;
  amount: number;
  expenseDate: string;
  paymentMethod: string;
};

export default function ExpensesTable({ expenses, currency }: { expenses: ExpenseRow[]; currency: string }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Delete this expense?")) return;
    setDeletingId(id);
    await deleteExpense(id);
    setDeletingId(null);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="font-medium">Expenses</h2>
        <Button onClick={() => setAdding(true)}>Log expense</Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-paper-100 dark:bg-ink-800 text-left text-foreground/60">
            <tr>
              <th className="px-4 py-2.5 font-medium">Date</th>
              <th className="px-4 py-2.5 font-medium">Description</th>
              <th className="px-4 py-2.5 font-medium">Category</th>
              <th className="px-4 py-2.5 font-medium">Method</th>
              <th className="px-4 py-2.5 font-medium text-right">Amount</th>
              <th className="px-4 py-2.5 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {expenses.map((e) => (
              <tr key={e.expenseId}>
                <td className="px-4 py-2.5 whitespace-nowrap text-foreground/60">
                  {new Date(e.expenseDate).toLocaleDateString()}
                </td>
                <td className="px-4 py-2.5">{e.description}</td>
                <td className="px-4 py-2.5 text-foreground/60">{e.category}</td>
                <td className="px-4 py-2.5 text-foreground/60">{e.paymentMethod}</td>
                <td className="px-4 py-2.5 text-right text-ruby-500">{fmtMoney(e.amount, currency)}</td>
                <td className="px-4 py-2.5">
                  <button
                    onClick={() => handleDelete(e.expenseId)}
                    disabled={deletingId === e.expenseId}
                    className="p-1.5 rounded-md hover:bg-border/60 text-ruby-500"
                    aria-label={`Delete ${e.description}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
            {expenses.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-foreground/50">
                  No expenses logged yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {adding && <ExpenseForm onClose={() => setAdding(false)} />}
    </div>
  );
}
