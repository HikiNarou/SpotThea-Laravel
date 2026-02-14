import Link from "next/link";

import { ForgotPasswordForm } from "@/components/forms/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <section className="space-y-5 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 md:p-8">
      <header className="space-y-2 text-center">
        <h1 className="font-display text-4xl text-[var(--text-primary)]">Forgot Password</h1>
        <p className="text-sm text-[var(--text-secondary)]">Masukkan email akun, link reset akan dikirim.</p>
      </header>
      <ForgotPasswordForm />
      <div className="text-center text-sm text-[var(--text-secondary)]">
        Kembali ke <Link href="/login" className="text-[var(--accent)] hover:underline">Login</Link>
      </div>
    </section>
  );
}