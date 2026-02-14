import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-4 text-center">
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--text-muted)]">404</p>
        <h1 className="font-display text-4xl text-[var(--text-primary)]">Halaman tidak ditemukan</h1>
        <p className="text-sm text-[var(--text-secondary)]">URL yang kamu buka tidak tersedia atau sudah dipindahkan.</p>
        <div className="flex justify-center gap-2">
          <Link href="/">
            <Button>Back Home</Button>
          </Link>
          <Link href="/browse">
            <Button variant="secondary">Browse Manga</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}