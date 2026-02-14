"use client";

import Image from "next/image";
import { useState } from "react";

import { Button } from "@/components/ui/button";

interface ReaderImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  onReport?: () => void;
}

export function ReaderImage({ src, alt, width, height, className, onReport }: ReaderImageProps) {
  const [errored, setErrored] = useState(false);
  const [retrySeed, setRetrySeed] = useState(0);

  if (errored) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-6 text-center">
        <p className="text-sm text-[var(--text-secondary)]">Gambar gagal dimuat.</p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              setErrored(false);
              setRetrySeed((prev) => prev + 1);
            }}
          >
            Retry
          </Button>
          {onReport ? (
            <Button variant="danger" onClick={onReport}>
              Report Broken Page
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <Image
      key={retrySeed}
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={() => setErrored(true)}
      loading="lazy"
      unoptimized
    />
  );
}