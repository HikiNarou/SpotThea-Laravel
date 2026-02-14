"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/stores/app-store";

const schema = z.object({
  type: z.enum(["general", "manga", "chapter", "page"]),
  targetId: z.string().min(1, "Target ID wajib diisi"),
  reason: z.string().min(3, "Reason minimal 3 karakter"),
  details: z.string().min(8, "Detail minimal 8 karakter"),
});

type FormValues = z.infer<typeof schema>;

export function ReportForm() {
  const session = useAppStore((state) => state.session);
  const createReport = useAppStore((state) => state.createReport);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: "general",
      targetId: "",
      reason: "",
      details: "",
    },
  });

  const handleSubmit = form.handleSubmit((values) => {
    createReport({
      reporterUserId: session?.userId ?? null,
      type: values.type,
      targetId: values.targetId,
      reason: values.reason,
      details: values.details,
    });

    alert("Report tersimpan. Tim moderation akan meninjau.");
    form.reset({
      type: "general",
      targetId: "",
      reason: "",
      details: "",
    });
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <Select error={form.formState.errors.type?.message} {...form.register("type")}>
        <option value="general">General</option>
        <option value="manga">Manga</option>
        <option value="chapter">Chapter</option>
        <option value="page">Page</option>
      </Select>
      <Input placeholder="Target ID (contoh: manga-neon-requiem-chapter-4)" error={form.formState.errors.targetId?.message} {...form.register("targetId")} />
      <Input placeholder="Reason" error={form.formState.errors.reason?.message} {...form.register("reason")} />
      <Textarea placeholder="Detail masalah" error={form.formState.errors.details?.message} {...form.register("details")} />
      <Button type="submit" isLoading={form.formState.isSubmitting}>
        Submit Report
      </Button>
    </form>
  );
}
