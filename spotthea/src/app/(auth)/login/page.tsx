import Link from "next/link";

import { LoginForm } from "@/components/forms/login-form";
import { GuestOnlyGuard } from "@/components/layout/guest-only-guard";

export default function LoginPage() {
  return (
    <GuestOnlyGuard>
      <section className="space-y-5 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 md:p-8">
        <header className="space-y-2 text-center">
          <h1 className="font-display text-4xl text-[var(--text-primary)]">Login</h1>
          <p className="text-sm text-[var(--text-secondary)]">Masuk untuk sinkronisasi history, library, komentar, dan rating.</p>
        </header>
        <LoginForm />
        <div className="text-center text-sm text-[var(--text-secondary)]">
          Belum punya akun? <Link href="/register" className="text-[var(--accent)] hover:underline">Register</Link>
        </div>
        <div className="text-center text-sm text-[var(--text-secondary)]">
          Lupa password? <Link href="/forgot-password" className="text-[var(--accent)] hover:underline">Reset di sini</Link>
        </div>
      </section>
    </GuestOnlyGuard>
  );
}
