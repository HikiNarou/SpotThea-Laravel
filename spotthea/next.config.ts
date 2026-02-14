import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

function getBackendStoragePatterns() {
  const patterns: Array<{ protocol: "http" | "https"; hostname: string; port?: string; pathname: string }> = [
    {
      protocol: "http",
      hostname: "localhost",
      pathname: "/storage/**",
    },
    {
      protocol: "http",
      hostname: "localhost",
      port: "8000",
      pathname: "/storage/**",
    },
    {
      protocol: "http",
      hostname: "127.0.0.1",
      pathname: "/storage/**",
    },
    {
      protocol: "http",
      hostname: "127.0.0.1",
      port: "8000",
      pathname: "/storage/**",
    },
  ];

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!apiBaseUrl) {
    return patterns;
  }

  try {
    const parsed = new URL(apiBaseUrl);
    if (parsed.hostname) {
      patterns.push({
        protocol: parsed.protocol === "https:" ? "https" : "http",
        hostname: parsed.hostname,
        ...(parsed.port ? { port: parsed.port } : {}),
        pathname: "/storage/**",
      });
    }
  } catch {
    // Ignore invalid NEXT_PUBLIC_API_BASE_URL value.
  }

  return patterns;
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "flagcdn.com",
      },
      {
        protocol: "https",
        hostname: "i.ibb.co",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "i.ibb.co.com",
        pathname: "/**",
      },
      ...getBackendStoragePatterns(),
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
