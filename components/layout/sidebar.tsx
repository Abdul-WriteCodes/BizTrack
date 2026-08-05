"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  BookOpen,
  HandCoins,
  Activity,
  ShieldCheck,
  Settings,
} from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/sales", label: "Sales", icon: ShoppingCart },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/cashbook", label: "Cashbook", icon: BookOpen },
  { href: "/debts", label: "Debts", icon: HandCoins },
  { href: "/health", label: "Business health", icon: Activity },
  { href: "/settings/billing", label: "Billing", icon: Settings },
];

export default function Sidebar({ role }: { role: string }) {
  return (
    <aside className="hidden md:flex md:w-60 shrink-0 flex-col border-r border-border bg-ink-950 text-paper-100">
      <div className="px-5 py-6">
        <span className="font-display text-xl text-paper-50">BizTrack</span>
        <span className="text-brass-400 font-display text-xl">-OS</span>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {NAV.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}
        {role === "admin" && <NavLink href="/admin" label="Admin panel" icon={ShieldCheck} />}
      </nav>
    </aside>
  );
}

function NavLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname?.startsWith(href + "/");
  return (
    <Link
      href={href}
      className={clsx(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
        active ? "bg-ink-800 text-brass-400" : "text-paper-200/80 hover:bg-ink-800 hover:text-paper-50"
      )}
    >
      <Icon size={18} />
      {label}
    </Link>
  );
}
