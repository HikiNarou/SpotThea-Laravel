"use client";

import Link from "next/link";

import { useAppStore } from "@/stores/app-store";

function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href);
}

export function SiteFooter() {
  const platformSettings = useAppStore((state) => state.platformSettings);
  const siteName = platformSettings.siteName.trim() || "Spotthea";
  const footerDescription = platformSettings.footerDescription.trim();
  const footerCopyright = platformSettings.footerCopyright.trim();
  const footerLinks = platformSettings.footerLinks;

  return (
    <footer className="mt-16 border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-4 px-4 py-8 md:flex-row md:items-center md:justify-between md:px-6">
        <div>
          <p className="font-display text-lg text-[var(--text-primary)]">{siteName}</p>
          <p className="text-sm text-[var(--text-secondary)]">
            {footerDescription !== "" ? footerDescription : "Platform membaca manga dengan pengalaman reader fokus mobile dan desktop."}
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">{footerCopyright !== "" ? footerCopyright : `© ${siteName}`}</p>
        </div>

        <nav className="flex flex-wrap gap-2 text-sm">
          {footerLinks.map((link) => (
            <Link
              key={`${link.label}-${link.href}`}
              href={link.href}
              {...(isExternalHref(link.href) ? { target: "_blank", rel: "noreferrer noopener" } : {})}
              className="rounded-lg px-3 py-2 text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-soft)] hover:text-[var(--text-primary)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
