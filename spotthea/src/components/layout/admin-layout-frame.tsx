"use client";

import { usePathname } from "next/navigation";

import { AdminNav } from "@/components/layout/admin-nav";
import { AuthGuard } from "@/components/layout/auth-guard";

export function AdminLayoutFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AuthGuard roles={["admin", "moderator"]}>
      <div className="grid items-start gap-4 lg:grid-cols-[220px_1fr]">
        <AdminNav currentPath={pathname} />
        <div>{children}</div>
      </div>
    </AuthGuard>
  );
}
