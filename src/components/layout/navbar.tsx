"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { User, LogOut } from "lucide-react";

export function Navbar() {
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <header className="border-b border-[var(--border)] bg-[var(--bg-surface)]/80 px-4 py-3 backdrop-blur-md">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold gradient-text">Progress Analyzer</h1>
        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-2 md:flex">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-card)]">
              <User className="h-4 w-4 text-[var(--text-secondary)]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">{user?.name ?? "User"}</p>
              <p className="text-xs text-[var(--text-muted)]">{user?.email}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/auth/login" })}
            className="flex items-center gap-2 border-[var(--border)]"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
