"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

const TABS = [
  { href: "/inventory", label: "Products" },
  { href: "/inventory/restock", label: "Restock" },
  { href: "/inventory/suppliers", label: "Suppliers" },
];

export default function InventoryTabs() {
  const pathname = usePathname();
  return (
    <div className="flex gap-1 border-b border-border">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={clsx(
              "px-4 py-2 text-sm border-b-2 -mb-px transition-colors",
              active
                ? "border-brass-500 text-brass-600 font-medium"
                : "border-transparent text-foreground/60 hover:text-foreground"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
