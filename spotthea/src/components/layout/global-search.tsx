"use client";

import Image from "next/image";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useMemo, useState } from "react";

import { useSuggestionQuery } from "@/lib/api/hooks";
import { useDebounce } from "@/lib/utils/hooks";

export function GlobalSearch() {
  const router = useRouter();
  const inputId = useId();
  const listboxId = `${inputId}-listbox`;

  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const debounced = useDebounce(query, 250);
  const { data: suggestions = [], isFetching } = useSuggestionQuery(debounced);
  const options = useMemo(() => suggestions, [suggestions]);

  const handleSubmit = (nextQuery?: string) => {
    const value = (nextQuery ?? query).trim();
    if (!value) {
      return;
    }

    setIsOpen(false);
    router.push(`/search?q=${encodeURIComponent(value)}`);
  };

  return (
    <div className="relative w-full max-w-xl">
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          const activeItem = options[activeIndex];
          if (activeItem) {
            router.push(`/manga/${activeItem.slug}`);
            setIsOpen(false);
            return;
          }

          handleSubmit();
        }}
        className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3"
      >
        <Search size={16} className="text-[var(--text-muted)]" />
        <input
          id={inputId}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => {
            setTimeout(() => setIsOpen(false), 120);
          }}
          onKeyDown={(event) => {
            if (!isOpen || options.length === 0) {
              return;
            }

            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActiveIndex((prev) => Math.min(options.length - 1, prev + 1));
            }

            if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((prev) => Math.max(-1, prev - 1));
            }

            if (event.key === "Enter" && activeIndex >= 0) {
              event.preventDefault();
              router.push(`/manga/${options[activeIndex].slug}`);
              setIsOpen(false);
            }

            if (event.key === "Escape") {
              setIsOpen(false);
            }
          }}
          placeholder="Cari judul manga..."
          className="h-10 w-full bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? `${inputId}-option-${activeIndex}` : undefined}
        />
      </form>

      {isOpen && (query.trim().length > 1 || isFetching) ? (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-lg">
          <ul id={listboxId} role="listbox" className="max-h-80 overflow-auto p-2">
            {isFetching ? <li className="p-3 text-sm text-[var(--text-muted)]">Mencari...</li> : null}
            {!isFetching && options.length === 0 ? <li className="p-3 text-sm text-[var(--text-muted)]">Tidak ada suggestion.</li> : null}
            {options.map((item, index) => (
              <li
                key={item.id}
                id={`${inputId}-option-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                className={`flex cursor-pointer items-center gap-3 rounded-lg p-2 ${index === activeIndex ? "bg-[var(--surface-soft)]" : "hover:bg-[var(--surface-soft)]"}`}
                onMouseDown={(event) => {
                  event.preventDefault();
                  router.push(`/manga/${item.slug}`);
                  setIsOpen(false);
                }}
              >
                <Image src={item.coverUrl} alt={item.title} width={36} height={52} className="rounded-md object-cover" unoptimized />
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{item.title}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {item.status.toUpperCase()} · Ch. {item.latestChapterNumber}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="w-full border-t border-[var(--border)] px-3 py-2 text-left text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-soft)]"
            onMouseDown={(event) => {
              event.preventDefault();
              handleSubmit();
            }}
          >
            Lihat semua hasil untuk &quot;{query.trim()}&quot;
          </button>
        </div>
      ) : null}
    </div>
  );
}
