"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center px-4 text-center">
      <div className="space-y-3">
        <h1 className="font-display text-3xl text-[var(--text-primary)]">Terjadi error aplikasi</h1>
        <p className="text-sm text-[var(--text-secondary)]">Silakan coba ulang. Jika tetap terjadi, laporkan melalui halaman report.</p>
        <div className="flex justify-center gap-2">
          <Button onClick={reset}>Coba lagi</Button>
        </div>
      </div>
    </main>
  );
}