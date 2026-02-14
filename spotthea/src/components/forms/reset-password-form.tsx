"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const schema = z
  .object({
    password: z.string().min(8, "Password minimal 8 karakter"),
    confirmPassword: z.string().min(8, "Konfirmasi password minimal 8 karakter"),
  })
  .superRefine((values, ctx) => {
    if (values.password !== values.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Konfirmasi password tidak cocok",
        path: ["confirmPassword"],
      });
    }
  });

type FormValues = z.infer<typeof schema>;

export function ResetPasswordForm() {
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const handleSubmit = form.handleSubmit(() => {
    alert("Password berhasil diperbarui (simulasi frontend). Silakan login.");
    router.push("/login");
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input type="password" placeholder="Password baru" error={form.formState.errors.password?.message} {...form.register("password")} />
      <Input type="password" placeholder="Konfirmasi password" error={form.formState.errors.confirmPassword?.message} {...form.register("confirmPassword")} />
      <Button type="submit" className="w-full" isLoading={form.formState.isSubmitting}>
        Simpan Password
      </Button>
    </form>
  );
}