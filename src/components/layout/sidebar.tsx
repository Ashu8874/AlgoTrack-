"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart2,
  Brain,
  Calendar,
  ChevronDown,
  FileText,
  GitCompare,
  LayoutDashboard,
  Map,
  RefreshCw,
  Settings,
  Sun,
  Tag,
  Target,
  Timer,
  Trophy,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { slideInRight } from "@/lib/animations";

interface NavItem {
  icon: LucideIcon;
  label: string;
  href: string;
  color: string;
}

interface NavSection {
  id: string;
  title: string;
  emoji: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    id: "analytics",
    title: "Analytics",
    emoji: "📊",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", color: "#7C3AED" },
      { icon: FileText, label: "Submissions", href: "/dashboard/submissions", color: "#22D3EE" },
      { icon: BarChart2, label: "Analytics", href: "/dashboard/charts", color: "#34D399" },
      { icon: Tag, label: "Topics", href: "/dashboard/topics", color: "#F472B6" },
      { icon: Trophy, label: "Contests", href: "/dashboard/contests", color: "#FBBF24" },
    ],
  },
  {
    id: "practice",
    title: "Practice",
    emoji: "🎯",
    items: [
      { icon: Timer, label: "Session", href: "/dashboard/session", color: "#818CF8" },
      { icon: Brain, label: "Mock Interview", href: "/dashboard/mock-interview", color: "#F87171" },
      { icon: RefreshCw, label: "Revision", href: "/dashboard/revision", color: "#2DD4BF" },
      { icon: Sun, label: "Daily Challenge", href: "/dashboard/daily", color: "#FB923C" },
    ],
  },
  {
    id: "social",
    title: "Social",
    emoji: "🏆",
    items: [
      { icon: Users, label: "Leaderboard", href: "/dashboard/leaderboard", color: "#60A5FA" },
      { icon: GitCompare, label: "Compare", href: "/compare", color: "#A78BFA" },
    ],
  },
  {
    id: "planning",
    title: "Planning",
    emoji: "🗺️",
    items: [
      { icon: Map, label: "Roadmap", href: "/dashboard/roadmap", color: "#FBBF24" },
      { icon: Calendar, label: "Study Planner", href: "/dashboard/planner", color: "#C084FC" },
      { icon: Target, label: "Goals", href: "/dashboard/goals", color: "#34D399" },
      { icon: Zap, label: "Insights", href: "/dashboard/insights", color: "#A78BFA" },
    ],
  },
  {
    id: "account",
    title: "Account",
    emoji: "⚙️",
    items: [
      { icon: Settings, label: "Settings", href: "/dashboard/settings", color: "#94A3B8" },
    ],
  },
];

function NavLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  return (
    <Link
      href={item.href}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
        isActive
          ? "bg-[var(--bg-card-hover)] text-[var(--text-primary)]"
          : "text-[var(--text-secondary)] hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)]",
      )}
      style={isActive ? { borderLeft: `2px solid ${item.color}` } : undefined}
    >
      <item.icon className="h-4 w-4 shrink-0" style={{ color: item.color }} />
      <span>{item.label}</span>
    </Link>
  );
}

function NavSectionBlock({ section, pathname }: { section: NavSection; pathname: string }) {
  const hasActive = section.items.some(
    (item) => pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href)),
  );
  const [open, setOpen] = useState(hasActive || section.id === "analytics");

  return (
    <div className="mb-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
      >
        <span>
          {section.emoji} {section.title}
        </span>
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-0.5 py-1 pl-1">
              {section.items.map((item, i) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));
                return (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <NavLink item={item} isActive={isActive} />
                  </motion.div>
                );
              })}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:shrink-0">
      <div className="flex h-full flex-col overflow-y-auto border-r border-[var(--border)] bg-[var(--bg-surface)]/60 pt-5 backdrop-blur-md">
        <div className="flex shrink-0 items-center px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--purple-500)] to-[var(--cyan-400)]">
              <BarChart2 className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold gradient-text">LeetCode</span>
          </Link>
        </div>

        <motion.div
          className="mt-6 flex-1 space-y-1 px-2"
          variants={slideInRight}
          initial="initial"
          animate="animate"
        >
          {navSections.map((section) => (
            <NavSectionBlock key={section.id} section={section} pathname={pathname} />
          ))}
        </motion.div>
      </div>
    </div>
  );
}
