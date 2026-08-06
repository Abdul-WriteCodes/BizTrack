"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type MonthPoint = { month: string; revenue: number; expenses: number };

export default function TrendChart({ data, currency }: { data: MonthPoint[]; currency: string }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
        <YAxis
          tick={{ fontSize: 12 }}
          tickFormatter={(v) => `${currency}${Number(v).toLocaleString()}`}
          width={70}
        />
        <Tooltip
          formatter={(value) => `${currency}${Number(value).toLocaleString()}`}
          contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", fontSize: 13 }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="revenue" name="Revenue" fill="var(--color-jade-500)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expenses" name="Expenses" fill="var(--color-ruby-500)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
