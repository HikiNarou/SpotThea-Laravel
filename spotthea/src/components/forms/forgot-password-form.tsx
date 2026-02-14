"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const schema = z.object({
  email: z.string().email("Email tidak valid"),
});

type FormValues = z.infer<typeof schema>;

export function ForgotPasswordForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
    },
  });

  const handleSubmit = form.handleSubmit(() => {
    alert("Link reset password telah dikirim (simulasi frontend).");
    form.reset();
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input type="email" placeholder="you@example.com" error={form.formState.errors.email?.message} {...form.register("email")} />
      <Button type="submit" className="w-full" isLoading={form.formState.isSubmitting}>
        Kirim Link Reset
      </Button>
    </form>
  );
}