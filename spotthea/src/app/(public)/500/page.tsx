import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/layout/page-shell";

export default function FiveHundredPage() {
  return (
    <PageShell className="grid min-h-[60vh] place-items-center text-center">
      <div className="space-y-3">
        <h1 className="font-display text-4xl text-[var(--text-primary)]">500</h1>
        <p className="text-sm text-[var(--text-secondary)]">Terjadi kesalahan internal. Coba beberapa saat lagi.</p>
        <Link href="/">
          <Button>Kembali Home</Button>
        </Link>
      </div>
    </PageShell>
  );
}