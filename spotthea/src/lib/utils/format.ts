import { formatDistanceToNow, format as formatDateFns } from "date-fns";
import { id } from "date-fns/locale";

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("id-ID", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatRating(value: number) {
  return value.toFixed(1);
}

export function formatDate(dateString: string, pattern = "dd MMM yyyy") {
  return formatDateFns(new Date(dateString), pattern, { locale: id });
}

export function formatRelativeDate(dateString: string) {
  return formatDistanceToNow(new Date(dateString), {
    addSuffix: true,
    locale: id,
  });
}

export function titleCase(text: string) {
  return text
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((chunk) => chunk.slice(0, 1).toUpperCase() + chunk.slice(1).toLowerCase())
    .join(" ");
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}