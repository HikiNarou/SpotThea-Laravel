"use client";

import { PageShell } from "@/components/layout/page-shell";

export default function PrivacyPage() {
  return (
    <PageShell className="space-y-4">
      <h1 className="font-display text-4xl text-[var(--text-primary)]">Privacy Policy</h1>
      <p className="text-sm leading-7 text-[var(--text-secondary)]">
        SpotThea menyimpan data preferensi reader, history baca, dan aktivitas akun untuk meningkatkan pengalaman pengguna. Data sensitif sebaiknya diproteksi di backend menggunakan cookie httpOnly saat integrasi Laravel.
      </p>
    </PageShell>
  );
}