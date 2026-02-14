import { Button } from "@/components/ui/button";

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">Terjadi masalah</h2>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">{message}</p>
      {onRetry ? (
        <div className="mt-4">
          <Button onClick={onRetry}>Coba lagi</Button>
        </div>
      ) : null}
    </article>
  );
}