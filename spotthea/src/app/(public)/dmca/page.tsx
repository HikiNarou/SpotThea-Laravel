"use client";

import { PageShell } from "@/components/layout/page-shell";

export default function DmcaPage() {
  return (
    <PageShell className="space-y-4">
      <h1 className="font-display text-4xl text-[var(--text-primary)]">DMCA & Disclaimer</h1>
      <p className="text-sm leading-7 text-[var(--text-secondary)]">
        Jika kamu pemegang hak cipta dan menemukan konten bermasalah, kirim laporan resmi lewat halaman report/contact. Tim moderation akan meninjau dan menindak sesuai kebijakan platform.
      </p>
    </PageShell>
  );
}