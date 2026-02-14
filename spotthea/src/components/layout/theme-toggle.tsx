"use client";

import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isClient = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const activeTheme = isClient ? theme : undefined;

  return (
    <div className="inline-flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1">
      <Button variant={activeTheme === "light" ? "secondary" : "ghost"} size="sm" onClick={() => setTheme("light")} aria-label="Light mode">
        <Sun size={14} />
      </Button>
      <Button variant={activeTheme === "dark" ? "secondary" : "ghost"} size="sm" onClick={() => setTheme("dark")} aria-label="Dark mode">
        <Moon size={14} />
      </Button>
      <Button variant={activeTheme === "system" ? "secondary" : "ghost"} size="sm" onClick={() => setTheme("system")} aria-label="System mode">
        <Laptop size={14} />
      </Button>
    </div>
  );
}
