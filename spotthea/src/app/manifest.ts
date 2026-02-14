import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SpotThea Manga Reader",
    short_name: "SpotThea",
    description: "Manga reader dengan mode baca cepat, library, history, dan notifikasi.",
    start_url: "/",
    display: "standalone",
    background_color: "#101114",
    theme_color: "#ba2f28",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}