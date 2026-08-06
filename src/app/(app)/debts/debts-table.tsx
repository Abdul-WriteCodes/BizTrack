"use client";

import { useState } from "react";
import { fmtMoney } from "@/lib/format";
import PaymentForm from "./payment-form";

export type DebtRow = {
  debtId: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  amountPaid: number;
  balance: number;
  status: string;
  saleDate: string;
};

export default function DebtsTable({ debts, currency }: { debts: DebtRow[]; currency: string }) {
  const [paying, setPaying] = useState<DebtRow | null>(null);

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-paper-100 dark:bg-ink-800 text-left text-foreground/60">
          <tr>
            <th className="px-4 py-2.5 font-medium">Customer</th>
            <th className="px-4 py-2.5 font-medium">Date</th>
            <th className="px-4 py-2.5 font-medium text-right">Total</th>
            <th className="px-4 py-2.5 font-medium text-right">Paid</th>
            <th className="px-4 py-2.5 font-medium text-right">Balance</th>
            <th className="px-4 py-2.5 font-medium">Status</th>
            <th className="px-4 py-2.5 font-medium"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {debts.map((d) => (
            <tr key={d.debtId}>
              <td className="px-4 py-2.5">
                <p>{d.customerName || "Walk-in"}</p>
                {d.customerPhone && <p className="text-xs text-foreground/50">{d.customerPhone}</p>}
              </td>
              <td className="px-4 py-2.5 text-foreground/60 whitespace-nowrap">
                {new Date(d.saleDate).toLocaleDateString()}
              </td>
              <td className="px-4 py-2.5 text-right">{fmtMoney(d.totalAmount, currency)}</td>
              <td className="px-4 py-2.5 text-right text-jade-500">{fmtMoney(d.amountPaid, currency)}</td>
              <td className="px-4 py-2.5 text-right font-medium text-ruby-500">
                {fmtMoney(d.balance, currency)}
              </td>
              <td className="px-4 py-2.5 capitalize">
                <span
                  className={
                    d.status === "settled"
                      ? "text-jade-500"
                      : d.status === "partial"
                      ? "text-brass-600"
                      : "text-ruby-500"
                  }
                >
                  {d.status}
                </span>
              </td>
              <td className="px-4 py-2.5 text-right">
                {d.status !== "settled" && (
                  <button
                    onClick={() => setPaying(d)}
                    className="text-xs px-2.5 py-1.5 rounded-md border border-border hover:bg-border/60"
                  >
                    Record payment
                  </button>
                )}
              </td>
            </tr>
          ))}
          {debts.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-foreground/50">
                No debts found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {paying && (
        <PaymentForm
          debtId={paying.debtId}
          customerName={paying.customerName}
          balance={paying.balance}
          currency={currency}
          onClose={() => setPaying(null)}
        />
      )}
    </div>
  );
}
