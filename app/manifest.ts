import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EarlyHer",
    short_name: "EarlyHer",
    description: "Learn about breast health, understand changes, and find your next step.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#fffaf8",
    theme_color: "#e94c99",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/brand/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
