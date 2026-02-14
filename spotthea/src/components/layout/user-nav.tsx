"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { useAppStore } from "@/stores/app-store";

const userLinks = [
  { href: "/me", label: "Overview" },
  { href: "/me/library", label: "Library" },
  { href: "/me/history", label: "History" },
  { href: "/me/notifications", label: "Notifications" },
  { href: "/me/settings", label: "Settings" },
  { href: "/me/reviews", label: "Reviews" },
];

export function UserNav({ currentPath }: { currentPath: string }) {
  const router = useRouter();
  const logout = useAppStore((state) => state.logout);

  return (
    <aside className="h-fit rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2 lg:sticky lg:top-24">
      <nav className="grid gap-1 sm:grid-cols-3 lg:grid-cols-1">
        {userLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-lg px-3 py-2 text-sm",
              currentPath === link.href
                ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                : "text-[var(--text-secondary)] hover:bg-[var(--surface-soft)] hover:text-[var(--text-primary)]",
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="mt-2 border-t border-[var(--border)] pt-2">
        <Button
          type="button"
          variant="danger"
          size="sm"
          className="w-full"
          onClick={() => {
            logout();
            router.push("/");
          }}
        >
          Logout
        </Button>
      </div>
    </aside>
  );
}
