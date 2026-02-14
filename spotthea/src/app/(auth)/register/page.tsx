import Link from "next/link";

import { RegisterForm } from "@/components/forms/register-form";
import { GuestOnlyGuard } from "@/components/layout/guest-only-guard";

export default function RegisterPage() {
  return (
    <GuestOnlyGuard>
      <section className="space-y-5 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 md:p-8">
        <header className="space-y-2 text-center">
          <h1 className="font-display text-4xl text-[var(--text-primary)]">Register</h1>
          <p className="text-sm text-[var(--text-secondary)]">Buat akun baru untuk menyimpan progress baca antar device.</p>
        </header>
        <RegisterForm />
        <div className="text-center text-sm text-[var(--text-secondary)]">
          Sudah punya akun? <Link href="/login" className="text-[var(--accent)] hover:underline">Login</Link>
        </div>
      </section>
    </GuestOnlyGuard>
  );
}
