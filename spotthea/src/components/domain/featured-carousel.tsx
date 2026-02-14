"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Manga } from "@/types/domain";

export function FeaturedCarousel({ items }: { items: Manga[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (items.length <= 1) {
      return;
    }

    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [items.length]);

  if (items.length === 0) {
    return null;
  }

  const active = items[index];

  return (
    <section className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-soft)]">
      <div className="relative h-[340px] w-full md:h-[420px]">
        <Image
          src={active.bannerUrl}
          alt={active.title}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 768px) 100vw, 1280px"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/65 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

        <div className="absolute inset-0 p-6 pb-14 md:p-8 md:pb-16">
          <div className="grid h-full items-end gap-6 md:grid-cols-[minmax(0,1fr)_220px] md:gap-10">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge>{active.status.toUpperCase()}</Badge>
                <Badge tone={active.contentRating === "mature" ? "warning" : "success"}>{active.contentRating.toUpperCase()}</Badge>
                <Badge>{active.type.toUpperCase()}</Badge>
              </div>

              <h1 className="line-clamp-1 max-w-full pr-2 font-display text-2xl text-white md:pr-0 md:text-4xl">
                {active.title}
              </h1>
              <p className="mt-3 line-clamp-2 max-w-xl text-sm text-white/80 md:text-base">{active.synopsis}</p>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <Link href={`/manga/${active.slug}`}>
                  <Button size="lg">Lihat Detail</Button>
                </Link>
                <Link href={`/read/${active.slug}/${active.id}-chapter-${active.chapterCount}`}>
                  <Button variant="secondary" size="lg">
                    Baca Chapter Terbaru
                  </Button>
                </Link>
              </div>
            </div>

            <div className="relative hidden justify-self-end md:block">
              <div className="relative h-[300px] w-[220px] overflow-hidden rounded-xl border border-white/30 bg-black/20 shadow-[0_20px_40px_rgba(0,0,0,0.45)]">
                <Image
                  src={active.coverUrl}
                  alt={`${active.title} cover`}
                  fill
                  className="object-cover"
                  sizes="220px"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
          {items.map((item, itemIndex) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setIndex(itemIndex)}
              aria-label={`slide ${itemIndex + 1}`}
              className={`h-2 rounded-full transition-all ${itemIndex === index ? "w-8 bg-white" : "w-3 bg-white/45"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
