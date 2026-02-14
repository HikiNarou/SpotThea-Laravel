import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function VerifyEmailPage() {
  return (
    <section className="space-y-5 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
      <h1 className="font-display text-4xl text-[var(--text-primary)]">Verify Email</h1>
      <p className="text-sm text-[var(--text-secondary)]">Email berhasil diverifikasi. Akun kamu siap dipakai.</p>
      <div className="flex justify-center">
        <Link href="/login">
          <Button>Masuk Sekarang</Button>
        </Link>
      </div>
    </section>
  );
}