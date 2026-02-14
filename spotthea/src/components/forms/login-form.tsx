"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/stores/app-store";

const schema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
});

type FormValues = z.infer<typeof schema>;

export function LoginForm() {
  const router = useRouter();
  const login = useAppStore((state) => state.login);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    const result = await login(values.email, values.password);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setError(null);
    const currentSession = useAppStore.getState().session;
    const shouldOpenAdmin = currentSession?.role === "admin" || currentSession?.role === "moderator";
    router.push(shouldOpenAdmin ? "/admin" : "/me");
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input type="email" placeholder="you@example.com" error={form.formState.errors.email?.message} {...form.register("email")} />
      <Input type="password" placeholder="Password" error={form.formState.errors.password?.message} {...form.register("password")} />

      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}

      <Button type="submit" className="w-full" isLoading={form.formState.isSubmitting}>
        Login
      </Button>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3 text-xs text-[var(--text-secondary)]">
        <p className="font-semibold text-[var(--text-primary)]">Demo Accounts:</p>
        <p>User: user@spotthea.app / User12345!</p>
        <p>Admin: admin@spotthea.app / Admin12345!</p>
      </div>
    </form>
  );
}
