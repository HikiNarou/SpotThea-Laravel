"use client";

import Link from "next/link";

import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  return (
    <PageShell className="grid min-h-[60vh] place-items-center text-center">
      <div className="space-y-3">
        <h1 className="font-display text-4xl text-[var(--text-primary)]">Kamu sedang offline</h1>
        <p className="text-sm text-[var(--text-secondary)]">Periksa koneksi internet dan coba lagi. Mode offline fallback aktif.</p>
        <Link href="/">
          <Button>Kembali Home</Button>
        </Link>
      </div>
    </PageShell>
  );
}