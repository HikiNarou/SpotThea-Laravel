"use client";

import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { Heart, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMangaCommentsQuery } from "@/lib/api/hooks";
import { formatRelativeDate } from "@/lib/utils/format";
import { useAppStore, useMangaComments } from "@/stores/app-store";

const commentSchema = z.object({
  content: z.string().min(3, "Komentar minimal 3 karakter").max(600, "Komentar maksimal 600 karakter"),
});

type CommentForm = z.infer<typeof commentSchema>;

export function CommentsSection({ mangaId }: { mangaId: string }) {
  const session = useAppStore((state) => state.session);
  const addComment = useAppStore((state) => state.addComment);
  const deleteComment = useAppStore((state) => state.deleteComment);
  const likeComment = useAppStore((state) => state.likeComment);
  const localComments = useMangaComments(mangaId);
  const { data: dbComments, refetch: refetchDbComments } = useMangaCommentsQuery(mangaId);
  const comments = useMemo(
    () => (Array.isArray(dbComments) && /^\d+$/.test(mangaId) ? dbComments : localComments),
    [dbComments, localComments, mangaId],
  );

  const form = useForm<CommentForm>({
    resolver: zodResolver(commentSchema),
    defaultValues: { content: "" },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    const response = await addComment(mangaId, values.content);
    if (!response.ok) {
      alert(response.error);
      return;
    }

    form.reset();
    if (/^\d+$/.test(mangaId)) {
      void refetchDbComments();
    }
  });

  return (
    <section className="space-y-5" aria-labelledby="comments-heading">
      <header className="flex items-center justify-between">
        <h2 id="comments-heading" className="text-xl font-semibold text-[var(--text-primary)]">
          Komentar ({comments.length})
        </h2>
      </header>

      <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <Textarea
          placeholder={session ? "Tulis komentar kamu..." : "Login untuk menulis komentar"}
          disabled={!session || form.formState.isSubmitting}
          error={form.formState.errors.content?.message}
          {...form.register("content")}
        />
        <div className="flex justify-end">
          <Button type="submit" isLoading={form.formState.isSubmitting} disabled={!session}>
            Kirim Komentar
          </Button>
        </div>
      </form>

      <div className="space-y-3">
        {comments.length === 0 ? (
          <article className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-6 text-center text-sm text-[var(--text-secondary)]">
            Belum ada komentar. Jadi yang pertama memberikan review.
          </article>
        ) : null}

        {comments.map((comment) => {
          const canDelete = session && (session.userId === comment.userId || session.role === "admin" || session.role === "moderator");

          return (
            <article key={comment.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <div className="flex items-start gap-3">
                <Image src={comment.avatarUrl} alt={comment.username} width={40} height={40} className="rounded-full" unoptimized />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{comment.username}</p>
                    <p className="text-xs text-[var(--text-muted)]">{formatRelativeDate(comment.createdAt)}</p>
                  </div>
                  <p className="mt-2 whitespace-pre-line text-sm text-[var(--text-secondary)]">{comment.content}</p>

                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        const result = await likeComment(comment.id);
                        if (!result.ok) {
                          alert(result.error);
                          return;
                        }

                        if (/^\d+$/.test(mangaId)) {
                          void refetchDbComments();
                        }
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] px-2 py-1 text-xs hover:bg-[var(--surface-soft)]"
                    >
                      <Heart size={12} /> {comment.likes}
                    </button>

                    {canDelete ? (
                      <button
                        type="button"
                        onClick={async () => {
                          const result = await deleteComment(comment.id);
                          if (!result.ok) {
                            alert(result.error);
                            return;
                          }

                          if (/^\d+$/.test(mangaId)) {
                            void refetchDbComments();
                          }
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-500/40 px-2 py-1 text-xs text-red-500 hover:bg-red-500/10"
                      >
                        <Trash2 size={12} /> Hapus
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
