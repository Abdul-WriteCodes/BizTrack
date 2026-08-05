import { type ButtonHTMLAttributes, type InputHTMLAttributes, type LabelHTMLAttributes, type HTMLAttributes } from "react";
import { clsx } from "clsx";

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" }) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none",
        variant === "primary" && "bg-brass-500 text-ink-950 hover:bg-brass-400",
        variant === "ghost" && "bg-transparent text-foreground hover:bg-border/60 border border-border",
        variant === "danger" && "bg-ruby-500 text-white hover:opacity-90",
        className
      )}
      {...props}
    />
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={clsx(
        "w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none",
        "focus:ring-2 focus:ring-brass-400 focus:border-brass-400",
        className
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={clsx("block text-sm font-medium mb-1.5 text-foreground/80", className)} {...props} />
  );
}

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx("rounded-2xl border border-border bg-surface p-5 shadow-sm", className)}
      {...props}
    />
  );
}
