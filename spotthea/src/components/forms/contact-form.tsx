"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ApiClientError, apiRequest } from "@/lib/api/client";

const schema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  message: z.string().min(12, "Pesan minimal 12 karakter"),
});

type FormValues = z.infer<typeof schema>;

export function ContactForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      message: "",
    },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await apiRequest("/contact", {
        method: "POST",
        body: values,
      });

      alert("Pesan berhasil dikirim. Tim support akan merespons via email.");
      form.reset();
    } catch (error) {
      if (error instanceof ApiClientError) {
        alert(error.message);
        return;
      }

      alert("Gagal mengirim pesan. Silakan coba lagi.");
    }
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <Input placeholder="Nama" error={form.formState.errors.name?.message} {...form.register("name")} />
      <Input type="email" placeholder="Email" error={form.formState.errors.email?.message} {...form.register("email")} />
      <Textarea placeholder="Isi pesan" error={form.formState.errors.message?.message} {...form.register("message")} />
      <Button type="submit" isLoading={form.formState.isSubmitting}>
        Kirim Pesan
      </Button>
    </form>
  );
}
