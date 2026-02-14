import type { Metadata } from "next";
import { JetBrains_Mono, Lora, Outfit } from "next/font/google";

import { SITE_NAME, SITE_URL } from "@/lib/constants/site";
import { AppProviders } from "@/providers/app-providers";
import "./globals.css";

const bodyFont = Outfit({
  variable: "--font-body",
  subsets: ["latin"],
});

const displayFont = Lora({
  variable: "--font-display",
  subsets: ["latin"],
});

const monoFont = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ?? "";
const apiOrigin = (() => {
  if (apiBaseUrl === "") {
    return "";
  }

  try {
    const parsed = new URL(apiBaseUrl);
    return parsed.origin;
  } catch {
    return "";
  }
})();
const apiHost = apiOrigin !== "" ? new URL(apiOrigin).host : "";

const siteUrl = (() => {
  try {
    return new URL(SITE_URL);
  } catch {
    return new URL("https://spotthea.example");
  }
})();

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: `${SITE_NAME} - Manga Reader`,
    template: `%s | ${SITE_NAME}`,
  },
  description: "Platform baca manga cepat untuk desktop dan mobile dengan katalog, reader, library, dan dashboard admin.",
  keywords: ["manga", "manga reader", "webtoon", "manhwa", "manhua", "reader", "frontend"],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    title: `${SITE_NAME} - Manga Reader`,
    description: "Platform baca manga cepat untuk desktop dan mobile dengan katalog, reader, library, dan dashboard admin.",
    siteName: SITE_NAME,
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} - Manga Reader`,
    description: "Platform baca manga cepat untuk desktop dan mobile dengan katalog, reader, library, dan dashboard admin.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="dns-prefetch" href="//flagcdn.com" />
        <link rel="preconnect" href="https://flagcdn.com" crossOrigin="anonymous" />
        {apiOrigin !== "" ? (
          <>
            <link rel="dns-prefetch" href={`//${apiHost}`} />
            <link rel="preconnect" href={apiOrigin} crossOrigin="anonymous" />
          </>
        ) : null}
      </head>
      <body className={`${bodyFont.variable} ${displayFont.variable} ${monoFont.variable} antialiased`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
