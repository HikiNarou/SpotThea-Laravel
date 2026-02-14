import { cn } from "@/lib/utils/cn";

interface BadgeProps {
  children: React.ReactNode;
  tone?: "default" | "success" | "warning" | "danger";
  className?: string;
}

const toneClassName = {
  default: "bg-[var(--surface-soft)] text-[var(--text-secondary)]",
  success: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  warning: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  danger: "bg-red-500/15 text-red-700 dark:text-red-300",
};

export function Badge({ children, tone = "default", className }: BadgeProps) {
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", toneClassName[tone], className)}>{children}</span>;
}