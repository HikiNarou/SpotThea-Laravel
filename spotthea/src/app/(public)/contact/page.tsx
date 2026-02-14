"use client";

import { ContactForm } from "@/components/forms/contact-form";
import { PageShell } from "@/components/layout/page-shell";

export default function ContactPage() {
  return (
    <PageShell className="space-y-4">
      <h1 className="font-display text-4xl text-[var(--text-primary)]">Contact</h1>
      <p className="text-sm text-[var(--text-secondary)]">Kirim pertanyaan teknis, kerja sama, atau laporan non-urgent ke tim SpotThea.</p>
      <ContactForm />
    </PageShell>
  );
}