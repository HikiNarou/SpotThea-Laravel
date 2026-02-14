import type { PlatformAdItem, PlatformSettings, ReaderSettings } from "@/types/domain";

export const DEFAULT_READER_SETTINGS: ReaderSettings = {
  mode: "vertical",
  direction: "ltr",
  theme: "dim",
  fit: "width",
  gap: 16,
  autoNextChapter: true,
  preload: "low",
  reduceMotion: false,
  autoScrollEnabled: false,
  autoScrollSpeed: 80,
};

export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME?.trim() || "SpotThea";
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://spotthea.example").replace(/\/+$/, "");

const DEFAULT_HOME_TOP_ADS: PlatformAdItem[] = [];
const DEFAULT_HOME_BEFORE_LATEST_ADS: PlatformAdItem[] = [];
const DEFAULT_HOME_OVERLAY_ADS: PlatformAdItem[] = [];

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  maintenanceMode: false,
  siteName: "Spotthea",
  siteTagline: "Manga Reader",
  logoUrl: null,
  faviconUrl: null,
  headerNoticeEnabled: false,
  headerNoticeText: "",
  footerDescription: "Platform membaca manga dengan pengalaman reader fokus mobile dan desktop.",
  footerCopyright: "© Spotthea",
  footerLinks: [
    { label: "About", href: "/about" },
    { label: "DMCA", href: "/dmca" },
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
    { label: "Contact", href: "/contact" },
    { label: "Report", href: "/report" },
  ],
  homeAdsTopItems: DEFAULT_HOME_TOP_ADS,
  homeAdsBeforeLatestItems: DEFAULT_HOME_BEFORE_LATEST_ADS,
  homeAdsOverlayEnabled: false,
  homeAdsOverlayItems: DEFAULT_HOME_OVERLAY_ADS,
};

export const READING_MODES: Array<{ value: ReaderSettings["mode"]; label: string }> = [
  { value: "vertical", label: "Vertical" },
  { value: "paginated", label: "Paginated" },
  { value: "webtoon", label: "Webtoon" },
];

export const READER_THEMES: Array<{ value: ReaderSettings["theme"]; label: string }> = [
  { value: "light", label: "Light" },
  { value: "dim", label: "Dim" },
  { value: "dark", label: "Dark" },
  { value: "sepia", label: "Sepia" },
];

export const READER_FIT: Array<{ value: ReaderSettings["fit"]; label: string }> = [
  { value: "width", label: "Fit Width" },
  { value: "height", label: "Fit Height" },
  { value: "original", label: "Original" },
];
