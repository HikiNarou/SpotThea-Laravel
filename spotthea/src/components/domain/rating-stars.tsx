"use client";

import { Star } from "lucide-react";

import { cn } from "@/lib/utils/cn";

interface RatingStarsProps {
  value: number;
  onChange?: (value: number) => void;
  size?: "sm" | "md";
}

export function RatingStars({ value, onChange, size = "md" }: RatingStarsProps) {
  const stars = [1, 2, 3, 4, 5];
  const pixel = size === "sm" ? 14 : 18;

  return (
    <div className="flex items-center gap-1" role={onChange ? "radiogroup" : "presentation"} aria-label="rating">
      {stars.map((star) => {
        const active = star <= Math.round(value);
        return (
          <button
            type="button"
            key={star}
            role={onChange ? "radio" : undefined}
            aria-checked={onChange ? active : undefined}
            onClick={onChange ? () => onChange(star) : undefined}
            className={cn(onChange ? "cursor-pointer" : "cursor-default")}
            disabled={!onChange}
          >
            <Star size={pixel} className={cn(active ? "fill-amber-400 text-amber-400" : "text-[var(--text-muted)]")} />
          </button>
        );
      })}
    </div>
  );
}