import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

const variantClassName: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--accent)] text-[var(--accent-foreground)] border-transparent hover:bg-[var(--accent-strong)] focus-visible:ring-[var(--accent)]",
  secondary:
    "bg-[var(--surface-soft)] text-[var(--text-primary)] border-[var(--border)] hover:bg-[var(--surface-hover)] focus-visible:ring-[var(--accent)]",
  ghost: "bg-transparent text-[var(--text-primary)] border-transparent hover:bg-[var(--surface-soft)] focus-visible:ring-[var(--accent)]",
  danger: "bg-[var(--danger)] text-white border-transparent hover:bg-[var(--danger-strong)] focus-visible:ring-[var(--danger)]",
};

const sizeClassName: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-5 text-base",
};

export function Button({ className, variant = "primary", size = "md", isLoading = false, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl border font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] disabled:cursor-not-allowed disabled:opacity-60",
        variantClassName[variant],
        sizeClassName[size],
        className,
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden /> : null}
      {children}
    </button>
  );
}