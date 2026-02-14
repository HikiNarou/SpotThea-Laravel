"use client";

import { cn } from "@/lib/utils/cn";

interface TabItem {
  value: string;
  label: string;
}

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  items: TabItem[];
  className?: string;
}

export function Tabs({ value, onValueChange, items, className }: TabsProps) {
  return (
    <div className={cn("inline-flex rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-1", className)} role="tablist">
      {items.map((item) => (
        <button
          key={item.value}
          role="tab"
          aria-selected={value === item.value}
          type="button"
          className={cn(
            "rounded-lg px-3 py-1.5 text-sm transition-colors",
            value === item.value
              ? "bg-[var(--surface)] text-[var(--text-primary)] shadow-[var(--shadow-soft)]"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
          )}
          onClick={() => onValueChange(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}