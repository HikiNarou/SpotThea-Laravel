"use client";

import { usePathname } from "next/navigation";

import { useAppStore } from "@/stores/app-store";

export function MaintenanceGate() {
  const pathname = usePathname();
  const maintenanceMode = useAppStore((state) => state.maintenanceMode);

  if (!maintenanceMode) {
    return null;
  }

  if (pathname.startsWith("/admin") || pathname === "/maintenance") {
    return null;
  }

  return (
    <div className="border-b border-amber-500/40 bg-amber-500/15 px-4 py-2 text-center text-sm text-amber-800 dark:text-amber-300">
      Situs sedang dalam mode maintenance. Sebagian fitur mungkin dibatasi dan Website akan terasa lambat/berat.
    </div>
  );
}
