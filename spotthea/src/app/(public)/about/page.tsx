"use client";

import { PageShell } from "@/components/layout/page-shell";

export default function AboutPage() {
  return (
    <PageShell className="space-y-4">
      <h1 className="font-display text-4xl text-[var(--text-primary)]">About SpotThea</h1>
      <p className="text-sm leading-7 text-[var(--text-secondary)]">
        SpotThea adalah frontend manga reader yang dirancang untuk kecepatan, kenyamanan membaca, dan skalabilitas produksi. Fokus utama kami adalah alur discovery,
        detail manga, dan reader yang responsif di semua device.
      </p>
    </PageShell>
  );
}