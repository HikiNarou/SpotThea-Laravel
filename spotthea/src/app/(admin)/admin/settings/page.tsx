"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { BellRing, Brush, Globe, ImageIcon, ImagePlus, LayoutDashboard, Plus, Save, Settings2, Trash2 } from "lucide-react";

import {
  fetchAdminPlatformSettings,
  updateAdminPlatformSettings,
  uploadAdminMangaAsset,
} from "@/lib/api/admin-api";
import { ApiClientError, apiRequest } from "@/lib/api/client";
import { DEFAULT_PLATFORM_SETTINGS } from "@/lib/constants/site";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/stores/app-store";
import type { PlatformAdItem, PlatformSettings } from "@/types/domain";

type SectionId = "branding" | "header-footer" | "ads" | "system" | "broadcast";
type AdSlotKey = "homeAdsTopItems" | "homeAdsBeforeLatestItems" | "homeAdsOverlayItems";

interface BroadcastFormState {
  title: string;
  body: string;
}

const SECTION_ITEMS: Array<{ id: SectionId; label: string; icon: typeof Brush }> = [
  { id: "branding", label: "Branding", icon: Brush },
  { id: "header-footer", label: "Header & Footer", icon: LayoutDashboard },
  { id: "ads", label: "Ads", icon: ImageIcon },
  { id: "system", label: "System", icon: Settings2 },
  { id: "broadcast", label: "Broadcast", icon: BellRing },
];

const SECTION_DESCRIPTION: Record<SectionId, string> = {
  branding: "Kelola nama web, tagline, logo, dan favicon platform.",
  "header-footer": "Atur notice header dan konten footer agar konsisten di semua halaman publik.",
  ads: "Atur slot banner iklan untuk homepage: atas carousel, sebelum latest updates, dan overlay bawah.",
  system: "Kontrol maintenance mode dan dampaknya ke halaman publik.",
  broadcast: "Kirim pengumuman global ke user dan feed announcement publik.",
};

const AD_SLOT_CONFIG: Record<AdSlotKey, { title: string; description: string; maxItems: number }> = {
  homeAdsTopItems: {
    title: "Slot 1 - Above Carousel (4x2)",
    description: "Muncul di atas carousel homepage. Opsional, maksimal 8 banner (desktop 2 kolom x 4 baris).",
    maxItems: 8,
  },
  homeAdsBeforeLatestItems: {
    title: "Slot 2 - Before Latest Updates (2x2)",
    description: "Muncul sebelum section Latest Updates. Opsional, maksimal 4 banner (desktop 2 kolom x 2 baris).",
    maxItems: 4,
  },
  homeAdsOverlayItems: {
    title: "Slot 3 - Bottom Overlay",
    description: "Muncul sebagai overlay bawah homepage. Opsional, maksimal 2 banner + tombol close.",
    maxItems: 2,
  },
};

function resolveSectionFromHash(hash: string): SectionId {
  const key = hash.replace(/^#/, "");
  if (SECTION_ITEMS.some((item) => item.id === key)) {
    return key as SectionId;
  }

  return "branding";
}

function isSupportedLinkHref(value: string) {
  const trimmed = value.trim();
  if (trimmed === "") {
    return false;
  }

  return trimmed.startsWith("/") || /^https?:\/\//i.test(trimmed);
}

function normalizeDirectAdUrl(value: string) {
  const trimmed = value.trim();

  if (trimmed === "") {
    return "";
  }

  if (trimmed.startsWith("/") || /^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function withFallbackFooterLinks(settings: PlatformSettings): PlatformSettings {
  const normalizeAdItems = (items: PlatformAdItem[], maxItems: number) => {
    const normalized = items
      .map((item) => ({
        imageUrl: item.imageUrl.trim(),
        targetUrl: item.targetUrl.trim(),
        altText: item.altText.trim(),
      }))
      .filter((item) => item.imageUrl !== "" && item.targetUrl !== "")
      .slice(0, maxItems);

    return normalized;
  };

  return {
    ...settings,
    footerLinks: settings.footerLinks.length > 0 ? settings.footerLinks : DEFAULT_PLATFORM_SETTINGS.footerLinks,
    homeAdsTopItems: normalizeAdItems(settings.homeAdsTopItems, 8),
    homeAdsBeforeLatestItems: normalizeAdItems(settings.homeAdsBeforeLatestItems, 4),
    homeAdsOverlayItems: normalizeAdItems(settings.homeAdsOverlayItems, 2),
  };
}

function createEmptyAdItem(): PlatformAdItem {
  return {
    imageUrl: "",
    targetUrl: "/browse",
    altText: "",
  };
}

export default function AdminSettingsPage() {
  const session = useAppStore((state) => state.session);
  const role = useAppStore((state) => state.session?.role);
  const canWrite = role === "admin";
  const applyPlatformSettings = useAppStore((state) => state.applyPlatformSettings);
  const syncSessionCollections = useAppStore((state) => state.syncSessionCollections);
  const syncGuestAnnouncements = useAppStore((state) => state.syncGuestAnnouncements);

  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const faviconInputRef = useRef<HTMLInputElement | null>(null);
  const adUploadInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const [activeSection, setActiveSection] = useState<SectionId>("branding");
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingFavicon, setIsUploadingFavicon] = useState(false);
  const [uploadingAdKey, setUploadingAdKey] = useState<string | null>(null);
  const [formState, setFormState] = useState<PlatformSettings>(DEFAULT_PLATFORM_SETTINGS);
  const [settingsStatus, setSettingsStatus] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  const [broadcastForm, setBroadcastForm] = useState<BroadcastFormState>({
    title: "",
    body: "",
  });
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastStatus, setBroadcastStatus] = useState<string | null>(null);

  const sectionIndex = useMemo(() => SECTION_ITEMS.findIndex((item) => item.id === activeSection), [activeSection]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleHash = () => {
      setActiveSection(resolveSectionFromHash(window.location.hash));
    };

    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  useEffect(() => {
    if (!session?.token || !canWrite) {
      return;
    }

    setIsLoadingSettings(true);
    setSettingsError(null);
    setSettingsStatus(null);

    void fetchAdminPlatformSettings(session.token)
      .then((response) => {
        setFormState(withFallbackFooterLinks(response));
      })
      .catch((error) => {
        if (error instanceof ApiClientError) {
          setSettingsError(error.message);
          return;
        }

        setSettingsError("Gagal memuat platform settings.");
      })
      .finally(() => setIsLoadingSettings(false));
  }, [canWrite, session?.token]);

  const selectSection = (section: SectionId) => {
    setActiveSection(section);

    if (typeof window !== "undefined") {
      const nextHash = `#${section}`;
      if (window.location.hash !== nextHash) {
        window.history.replaceState(null, "", nextHash);
      }
    }
  };

  const updateFooterLink = (index: number, key: "label" | "href", value: string) => {
    setFormState((current) => ({
      ...current,
      footerLinks: current.footerLinks.map((link, linkIndex) =>
        linkIndex === index
          ? {
              ...link,
              [key]: value,
            }
          : link,
      ),
    }));
  };

  const addFooterLink = () => {
    setFormState((current) => ({
      ...current,
      footerLinks: [...current.footerLinks, { label: "", href: "" }],
    }));
  };

  const removeFooterLink = (index: number) => {
    setFormState((current) => {
      const next = current.footerLinks.filter((_, linkIndex) => linkIndex !== index);
      return {
        ...current,
        footerLinks: next.length > 0 ? next : current.footerLinks,
      };
    });
  };

  const updateAdItem = (slot: AdSlotKey, index: number, key: keyof PlatformAdItem, value: string) => {
    setFormState((current) => ({
      ...current,
      [slot]: current[slot].map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [key]: key === "targetUrl" ? normalizeDirectAdUrl(value) : value,
            }
          : item,
      ),
    }));
  };

  const addAdItem = (slot: AdSlotKey) => {
    const maxItems = AD_SLOT_CONFIG[slot].maxItems;
    setFormState((current) => {
      if (current[slot].length >= maxItems) {
        return current;
      }

      return {
        ...current,
        [slot]: [...current[slot], createEmptyAdItem()],
      };
    });
  };

  const removeAdItem = (slot: AdSlotKey, index: number) => {
    setFormState((current) => {
      const nextItems = current[slot].filter((_, itemIndex) => itemIndex !== index);
      return {
        ...current,
        [slot]: nextItems,
      };
    });
  };

  const uploadAdItem = async (slot: AdSlotKey, index: number, file: File | null) => {
    if (!file || !session?.token || !canWrite) {
      return;
    }

    const uploadKey = `${slot}-${index}`;
    setUploadingAdKey(uploadKey);
    setSettingsError(null);
    setSettingsStatus(null);

    try {
      const uploaded = await uploadAdminMangaAsset("ad_banner", file, session.token);
      updateAdItem(slot, index, "imageUrl", uploaded.url);
    } catch (error) {
      if (error instanceof ApiClientError) {
        setSettingsError(error.message);
      } else {
        setSettingsError("Gagal upload gambar banner iklan.");
      }
    } finally {
      setUploadingAdKey((current) => (current === uploadKey ? null : current));
    }
  };

  const validateSettings = (payload: PlatformSettings): string | null => {
    if (payload.siteName.trim() === "") {
      return "Nama website wajib diisi.";
    }

    if (payload.headerNoticeEnabled && payload.headerNoticeText.trim() === "") {
      return "Header notice text wajib diisi saat header notice diaktifkan.";
    }

    if (payload.footerLinks.length === 0) {
      return "Minimal satu footer link wajib diisi.";
    }

    for (const [index, footerLink] of payload.footerLinks.entries()) {
      if (footerLink.label.trim() === "" || footerLink.href.trim() === "") {
        return `Footer link #${index + 1} belum lengkap.`;
      }

      if (!isSupportedLinkHref(footerLink.href)) {
        return `Footer link #${index + 1} harus berupa path '/' atau URL http/https.`;
      }
    }

    if (payload.logoUrl && !isSupportedLinkHref(payload.logoUrl)) {
      return "Logo URL harus berupa path '/' atau URL http/https.";
    }

    if (payload.faviconUrl && !isSupportedLinkHref(payload.faviconUrl)) {
      return "Favicon URL harus berupa path '/' atau URL http/https.";
    }

    const adSlots: Array<{ key: AdSlotKey; label: string }> = [
      { key: "homeAdsTopItems", label: "Slot iklan 1 (Above Carousel)" },
      { key: "homeAdsBeforeLatestItems", label: "Slot iklan 2 (Before Latest Updates)" },
      { key: "homeAdsOverlayItems", label: "Slot iklan 3 (Bottom Overlay)" },
    ];

    for (const slot of adSlots) {
      const items = payload[slot.key];
      const slotMax = AD_SLOT_CONFIG[slot.key].maxItems;

      if (items.length > slotMax) {
        return `${slot.label} maksimal ${slotMax} banner.`;
      }

      for (const [index, item] of items.entries()) {
        if (!isSupportedLinkHref(item.imageUrl)) {
          return `${slot.label} item #${index + 1}: image URL wajib berupa path '/' atau URL http/https.`;
        }

        if (!isSupportedLinkHref(item.targetUrl)) {
          return `${slot.label} item #${index + 1}: target URL wajib berupa path '/' atau URL http/https.`;
        }
      }
    }

    return null;
  };

  const savePlatformSettings = async () => {
    if (!session?.token || !canWrite) {
      setSettingsError("Session admin tidak valid. Silakan login ulang.");
      return;
    }

    const validationError = validateSettings(formState);
    if (validationError) {
      setSettingsError(validationError);
      setSettingsStatus(null);
      return;
    }

    setIsSavingSettings(true);
    setSettingsError(null);
    setSettingsStatus(null);

    try {
      const updated = await updateAdminPlatformSettings(formState, session.token);
      const normalized = withFallbackFooterLinks(updated);
      setFormState(normalized);
      applyPlatformSettings(normalized);
      setSettingsStatus("Platform settings berhasil disimpan dan langsung diterapkan.");
    } catch (error) {
      if (error instanceof ApiClientError) {
        setSettingsError(error.message);
      } else {
        setSettingsError("Gagal menyimpan platform settings.");
      }
    } finally {
      setIsSavingSettings(false);
    }
  };

  const uploadBrandAsset = async (type: "site_logo" | "site_favicon", file: File | null) => {
    if (!file || !session?.token || !canWrite) {
      return;
    }

    if (type === "site_logo") {
      setIsUploadingLogo(true);
    } else {
      setIsUploadingFavicon(true);
    }

    setSettingsError(null);
    setSettingsStatus(null);

    try {
      const uploaded = await uploadAdminMangaAsset(type, file, session.token);
      setFormState((current) => ({
        ...current,
        ...(type === "site_logo" ? { logoUrl: uploaded.url } : { faviconUrl: uploaded.url }),
      }));
    } catch (error) {
      if (error instanceof ApiClientError) {
        setSettingsError(error.message);
      } else {
        setSettingsError("Gagal upload asset branding.");
      }
    } finally {
      if (type === "site_logo") {
        setIsUploadingLogo(false);
      } else {
        setIsUploadingFavicon(false);
      }
    }
  };

  const sendBroadcast = async () => {
    if (!session?.token || !canWrite) {
      setBroadcastStatus("Session admin tidak ditemukan. Silakan login ulang.");
      return;
    }

    if (!broadcastForm.title.trim() || !broadcastForm.body.trim()) {
      setBroadcastStatus("Isi title dan body announcement terlebih dahulu.");
      return;
    }

    setIsBroadcasting(true);
    setBroadcastStatus(null);

    try {
      const response = await apiRequest<{ sent: number }>("/admin/broadcast", {
        method: "POST",
        token: session.token,
        body: {
          title: broadcastForm.title.trim(),
          body: broadcastForm.body.trim(),
        },
      });

      setBroadcastForm({ title: "", body: "" });
      setBroadcastStatus(`Announcement berhasil dikirim ke ${response.sent} akun user.`);

      await Promise.all([syncSessionCollections(), syncGuestAnnouncements()]);
    } catch (error) {
      if (error instanceof ApiClientError) {
        setBroadcastStatus(error.message);
      } else {
        setBroadcastStatus("Gagal mengirim broadcast announcement.");
      }
    } finally {
      setIsBroadcasting(false);
    }
  };

  if (!session?.token) {
    return <EmptyState title="Login dibutuhkan" description="Silakan login sebagai admin untuk mengelola platform settings." ctaHref="/login" ctaLabel="Masuk" />;
  }

  if (!canWrite) {
    return <EmptyState title="Akses ditolak" description="Halaman settings platform hanya untuk role admin." ctaHref="/admin" ctaLabel="Kembali" />;
  }

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-[var(--text-muted)]">Admin / Platform Settings</p>
          <h1 className="font-display text-3xl text-[var(--text-primary)]">Platform Settings</h1>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Step {sectionIndex + 1}/{SECTION_ITEMS.length}: {SECTION_DESCRIPTION[activeSection]}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/admin">
            <Button variant="ghost">Kembali</Button>
          </Link>
          <Button onClick={() => void savePlatformSettings()} isLoading={isSavingSettings || isLoadingSettings}>
            <Save size={16} />
            Simpan Settings
          </Button>
        </div>
      </header>

      {settingsError ? (
        <article className="rounded-xl border border-[var(--danger)]/40 bg-[var(--danger)]/5 px-3 py-2 text-sm text-[var(--danger)]">{settingsError}</article>
      ) : null}

      {settingsStatus ? (
        <article className="rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">{settingsStatus}</article>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[220px_1fr] lg:items-start">
        <aside className="h-fit rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 lg:sticky lg:top-24">
          <nav className="space-y-1">
            {SECTION_ITEMS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => selectSection(id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  activeSection === id
                    ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--surface-soft)] hover:text-[var(--text-primary)]",
                )}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="space-y-4">
          <section
            id="branding"
            className={cn(
              "rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4",
              activeSection !== "branding" && "hidden",
            )}
          >
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Branding</h2>
            <p className="text-sm text-[var(--text-secondary)]">Nama web, tagline, logo, dan favicon yang dipakai di frontend publik.</p>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <Input
                value={formState.siteName}
                onChange={(event) => setFormState((current) => ({ ...current, siteName: event.target.value }))}
                placeholder="Nama website"
              />
              <Input
                value={formState.siteTagline}
                onChange={(event) => setFormState((current) => ({ ...current, siteTagline: event.target.value }))}
                placeholder="Tagline website"
              />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <article className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3">
                <p className="text-sm font-semibold text-[var(--text-primary)]">Logo</p>
                <div className="mt-2 grid h-28 place-items-center overflow-hidden rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface)]">
                  {formState.logoUrl ? (
                    <Image src={formState.logoUrl} alt="Logo preview" width={110} height={110} className="h-full w-full object-contain p-2" unoptimized />
                  ) : (
                    <span className="text-xs text-[var(--text-muted)]">Belum ada logo</span>
                  )}
                </div>
                <div className="mt-2 flex gap-2">
                  <Input
                    value={formState.logoUrl ?? ""}
                    onChange={(event) => setFormState((current) => ({ ...current, logoUrl: event.target.value }))}
                    placeholder="Logo URL"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    isLoading={isUploadingLogo}
                    onClick={() => logoInputRef.current?.click()}
                  >
                    <ImagePlus size={14} />
                    Upload
                  </Button>
                </div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.currentTarget.files?.[0] ?? null;
                    void uploadBrandAsset("site_logo", file);
                    event.currentTarget.value = "";
                  }}
                />
              </article>

              <article className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3">
                <p className="text-sm font-semibold text-[var(--text-primary)]">Favicon</p>
                <div className="mt-2 grid h-28 place-items-center overflow-hidden rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface)]">
                  {formState.faviconUrl ? (
                    <Image src={formState.faviconUrl} alt="Favicon preview" width={56} height={56} className="h-14 w-14 rounded-lg object-contain" unoptimized />
                  ) : (
                    <span className="text-xs text-[var(--text-muted)]">Belum ada favicon</span>
                  )}
                </div>
                <div className="mt-2 flex gap-2">
                  <Input
                    value={formState.faviconUrl ?? ""}
                    onChange={(event) => setFormState((current) => ({ ...current, faviconUrl: event.target.value }))}
                    placeholder="Favicon URL"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    isLoading={isUploadingFavicon}
                    onClick={() => faviconInputRef.current?.click()}
                  >
                    <Globe size={14} />
                    Upload
                  </Button>
                </div>
                <input
                  ref={faviconInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/avif,image/gif,image/x-icon"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.currentTarget.files?.[0] ?? null;
                    void uploadBrandAsset("site_favicon", file);
                    event.currentTarget.value = "";
                  }}
                />
              </article>
            </div>
          </section>

          <section
            id="header-footer"
            className={cn(
              "rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4",
              activeSection !== "header-footer" && "hidden",
            )}
          >
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Header & Footer</h2>
            <p className="text-sm text-[var(--text-secondary)]">Semua perubahan akan langsung terlihat pada komponen publik.</p>

            <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3">
              <Switch
                checked={formState.headerNoticeEnabled}
                onChange={(next) => setFormState((current) => ({ ...current, headerNoticeEnabled: next }))}
                label="Aktifkan header notice"
              />
              <Textarea
                value={formState.headerNoticeText}
                onChange={(event) => setFormState((current) => ({ ...current, headerNoticeText: event.target.value }))}
                className="mt-3 min-h-24"
                placeholder="Isi pesan notice header..."
              />
            </div>

            <div className="mt-3 grid gap-3">
              <Textarea
                value={formState.footerDescription}
                onChange={(event) => setFormState((current) => ({ ...current, footerDescription: event.target.value }))}
                className="min-h-24"
                placeholder="Footer description"
              />
              <Input
                value={formState.footerCopyright}
                onChange={(event) => setFormState((current) => ({ ...current, footerCopyright: event.target.value }))}
                placeholder="Copyright text"
              />
            </div>

            <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-[var(--text-primary)]">Footer Links</p>
                <Button type="button" variant="secondary" size="sm" onClick={addFooterLink}>
                  <Plus size={14} />
                  Add Link
                </Button>
              </div>

              <div className="space-y-2">
                {formState.footerLinks.map((footerLink, index) => (
                  <div key={`footer-link-${index}`} className="grid gap-2 md:grid-cols-[200px_1fr_auto]">
                    <Input
                      value={footerLink.label}
                      onChange={(event) => updateFooterLink(index, "label", event.target.value)}
                      placeholder="Label"
                    />
                    <Input
                      value={footerLink.href}
                      onChange={(event) => updateFooterLink(index, "href", event.target.value)}
                      placeholder="/about atau https://example.com"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFooterLink(index)}
                      disabled={formState.footerLinks.length <= 1}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section
            id="ads"
            className={cn(
              "rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4",
              activeSection !== "ads" && "hidden",
            )}
          >
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Homepage Ads</h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Kelola slot iklan homepage: atas carousel, sebelum latest updates, dan overlay bawah.
            </p>

            <div className="mt-3 space-y-4">
              {(["homeAdsTopItems", "homeAdsBeforeLatestItems", "homeAdsOverlayItems"] as AdSlotKey[]).map((slotKey) => {
                const slot = AD_SLOT_CONFIG[slotKey];
                const items = formState[slotKey];

                return (
                  <article key={slotKey} className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{slot.title}</h3>
                        <p className="text-xs text-[var(--text-muted)]">{slot.description}</p>
                      </div>

                      <Button type="button" variant="secondary" size="sm" onClick={() => addAdItem(slotKey)} disabled={items.length >= slot.maxItems}>
                        <Plus size={14} />
                        Add Banner ({items.length}/{slot.maxItems})
                      </Button>
                    </div>

                    {slotKey === "homeAdsOverlayItems" ? (
                      <div className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
                        <Switch
                          checked={formState.homeAdsOverlayEnabled}
                          onChange={(next) => setFormState((current) => ({ ...current, homeAdsOverlayEnabled: next }))}
                          label="Aktifkan slot overlay bawah di homepage"
                        />
                      </div>
                    ) : null}

                    <div className="mt-3 space-y-3">
                      {items.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface)] px-3 py-4 text-sm text-[var(--text-muted)]">
                          Belum ada banner untuk slot ini. Slot akan otomatis tidak tampil di homepage.
                        </div>
                      ) : null}

                      {items.map((item, index) => {
                        const uploadKey = `${slotKey}-${index}`;
                        const isUploadingCurrent = uploadingAdKey === uploadKey;

                        return (
                          <div key={`${slotKey}-${index}`} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
                            <div className="grid gap-3 lg:grid-cols-[260px_1fr]">
                              <div className="relative aspect-[25/3] overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface-soft)]">
                                {item.imageUrl.trim() !== "" ? (
                                  <Image src={item.imageUrl} alt={item.altText || `Ad banner ${index + 1}`} fill className="object-cover" unoptimized />
                                ) : (
                                  <div className="grid h-full w-full place-items-center text-xs text-[var(--text-muted)]">Preview banner</div>
                                )}
                              </div>

                              <div className="space-y-2">
                                <div className="grid gap-2 md:grid-cols-[1fr_auto_auto]">
                                  <Input
                                    value={item.imageUrl}
                                    onChange={(event) => updateAdItem(slotKey, index, "imageUrl", event.target.value)}
                                    placeholder="/storage/ads/banner.jpg atau https://..."
                                  />
                                  <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    isLoading={isUploadingCurrent}
                                    onClick={() => adUploadInputRefs.current[uploadKey]?.click()}
                                  >
                                    <ImagePlus size={14} />
                                    Upload
                                  </Button>
                                  <Button type="button" variant="ghost" size="sm" onClick={() => removeAdItem(slotKey, index)}>
                                    <Trash2 size={14} />
                                    Remove
                                  </Button>
                                </div>

                                <Input
                                  value={item.targetUrl}
                                  onChange={(event) => updateAdItem(slotKey, index, "targetUrl", event.target.value)}
                                  placeholder={`Direct URL pengiklan #${index + 1} (https://...)`}
                                />

                                <p className="text-[11px] text-[var(--text-muted)]">
                                  Banner #{index + 1} · URL ini dipakai untuk redirect klik banner.
                                </p>
                              </div>
                            </div>

                            <input
                              ref={(node) => {
                                adUploadInputRefs.current[uploadKey] = node;
                              }}
                              type="file"
                              accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
                              className="hidden"
                              onChange={(event) => {
                                const file = event.currentTarget.files?.[0] ?? null;
                                void uploadAdItem(slotKey, index, file);
                                event.currentTarget.value = "";
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section
            id="system"
            className={cn(
              "rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4",
              activeSection !== "system" && "hidden",
            )}
          >
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">System Controls</h2>
            <p className="text-sm text-[var(--text-secondary)]">Mode maintenance akan ditampilkan di seluruh halaman publik non-admin.</p>

            <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3">
              <Switch
                checked={formState.maintenanceMode}
                onChange={(next) => setFormState((current) => ({ ...current, maintenanceMode: next }))}
                label="Aktifkan maintenance mode"
              />
              <p className="mt-2 text-xs text-[var(--text-muted)]">
                Saat aktif, maintenance gate akan muncul untuk pengguna publik. Halaman admin tetap dapat diakses.
              </p>
            </div>
          </section>

          <section
            id="broadcast"
            className={cn(
              "rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4",
              activeSection !== "broadcast" && "hidden",
            )}
          >
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Broadcast Announcement</h2>
            <p className="text-sm text-[var(--text-secondary)]">Kirim notifikasi ke semua user dan tampilkan di feed announcement publik.</p>

            <div className="mt-3 grid gap-3">
              <Input
                value={broadcastForm.title}
                onChange={(event) => setBroadcastForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="Judul notifikasi"
              />
              <Textarea
                value={broadcastForm.body}
                onChange={(event) => setBroadcastForm((current) => ({ ...current, body: event.target.value }))}
                className="min-h-32"
                placeholder="Isi pengumuman"
              />
              <Button onClick={() => void sendBroadcast()} isLoading={isBroadcasting} className="w-fit">
                Kirim Broadcast
              </Button>
              {broadcastStatus ? <p className="text-sm text-[var(--text-secondary)]">{broadcastStatus}</p> : null}
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
