"use client";

import { usePathname } from "next/navigation";

import { AuthGuard } from "@/components/layout/auth-guard";
import { UserNav } from "@/components/layout/user-nav";

export function UserLayoutFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AuthGuard>
      <div className="grid items-start gap-4 lg:grid-cols-[220px_1fr]">
        <UserNav currentPath={pathname} />
        <div>{children}</div>
      </div>
    </AuthGuard>
  );
}
