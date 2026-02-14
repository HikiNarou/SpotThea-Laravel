import { cn } from "@/lib/utils/cn";

export function PageShell({ className, children }: { className?: string; children: React.ReactNode }) {
  return <main className={cn("mx-auto w-full max-w-[1280px] px-4 py-6 md:px-6", className)}>{children}</main>;
}