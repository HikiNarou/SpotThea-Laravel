import { ResetPasswordForm } from "@/components/forms/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <section className="space-y-5 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 md:p-8">
      <header className="space-y-2 text-center">
        <h1 className="font-display text-4xl text-[var(--text-primary)]">Reset Password</h1>
        <p className="text-sm text-[var(--text-secondary)]">Set password baru untuk akun kamu.</p>
      </header>
      <ResetPasswordForm />
    </section>
  );
}