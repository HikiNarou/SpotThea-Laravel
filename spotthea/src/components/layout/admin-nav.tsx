"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { useAppStore } from "@/stores/app-store";

const adminLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/manga", label: "Manga" },
  { href: "/admin/create/manga", label: "Create Manga" },
  { href: "/admin/genres", label: "Genres" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/settings", label: "Settings" },
];

function isLinkActive(currentPath: string, href: string) {
  if (href === "/admin") {
    return currentPath === "/admin";
  }

  return currentPath === href || currentPath.startsWith(`${href}/`);
}

export function AdminNav({ currentPath }: { currentPath: string }) {
  const router = useRouter();
  const logout = useAppStore((state) => state.logout);

  return (
    <aside className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2">
      <nav className="grid gap-1 sm:grid-cols-3 lg:grid-cols-1">
        {adminLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-lg px-3 py-2 text-sm",
              isLinkActive(currentPath, link.href)
                ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                : "text-[var(--text-secondary)] hover:bg-[var(--surface-soft)] hover:text-[var(--text-primary)]",
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="mt-2 grid gap-2 border-t border-[var(--border)] pt-2">
        <Link href="/" className="rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-soft)] hover:text-[var(--text-primary)]">
          Back to Home
        </Link>
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
