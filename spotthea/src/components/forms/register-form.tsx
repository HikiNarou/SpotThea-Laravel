"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/stores/app-store";

const schema = z
  .object({
    username: z.string().min(3, "Username minimal 3 karakter"),
    email: z.string().email("Email tidak valid"),
    password: z.string().min(8, "Password minimal 8 karakter"),
    confirmPassword: z.string().min(8, "Konfirmasi password minimal 8 karakter"),
  })
  .superRefine((values, ctx) => {
    if (values.password !== values.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Konfirmasi password tidak cocok",
      });
    }
  });

type FormValues = z.infer<typeof schema>;

export function RegisterForm() {
  const router = useRouter();
  const register = useAppStore((state) => state.register);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    const result = await register({
      username: values.username,
      email: values.email,
      password: values.password,
    });

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setError(null);
    router.push("/verify-email?token=frontend-demo");
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input placeholder="Username" error={form.formState.errors.username?.message} {...form.register("username")} />
      <Input type="email" placeholder="you@example.com" error={form.formState.errors.email?.message} {...form.register("email")} />
      <Input type="password" placeholder="Password" error={form.formState.errors.password?.message} {...form.register("password")} />
      <Input type="password" placeholder="Confirm password" error={form.formState.errors.confirmPassword?.message} {...form.register("confirmPassword")} />

      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}

      <Button type="submit" className="w-full" isLoading={form.formState.isSubmitting}>
        Register
      </Button>
    </form>
  );
}
