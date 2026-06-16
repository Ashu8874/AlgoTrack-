"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart2,
  Calendar,
  LayoutDashboard,
  Sun,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TabItem {
  icon: LucideIcon;
  label: string;
  href: string;
  color: string;
}

const tabs: TabItem[] = [
  { icon: LayoutDashboard, label: "Home", href: "/dashboard", color: "#7C3AED" },
  { icon: BarChart2, label: "Charts", href: "/dashboard/charts", color: "#34D399" },
  { icon: Sun, label: "Daily", href: "/dashboard/daily", color: "#FB923C" },
  { icon: Users, label: "Friends", href: "/dashboard/leaderboard", color: "#60A5FA" },
  { icon: Calendar, label: "Planner", href: "/dashboard/planner", color: "#C084FC" },
];

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] bg-[var(--bg-surface)]/95 backdrop-blur-lg md:hidden">
      <div className="flex items-stretch justify-around px-1 pb-[env(safe-area-inset-bottom)]">
        {tabs.map((tab) => {
          const isActive =
            pathname === tab.href ||
            (tab.href !== "/dashboard" && pathname.startsWith(tab.href));

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
                isActive ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]",
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-xl transition-all",
                  isActive && "bg-[var(--bg-card-hover)]",
                )}
              >
                <tab.icon
                  className="h-5 w-5"
                  style={{ color: isActive ? tab.color : undefined }}
                />
              </div>
              <span style={isActive ? { color: tab.color } : undefined}>{tab.label}</span>
              {isActive && (
                <span
                  className="h-0.5 w-4 rounded-full"
                  style={{ background: tab.color }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
