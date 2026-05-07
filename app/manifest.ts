import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Unem AI",
    short_name: "Unem AI",
    description: "Жеке қаржы AI кеңесшісі",
    start_url: "/",
    display: "standalone",
    background_color: "#0f1117",
    theme_color: "#6366f1",
    orientation: "portrait",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  }
}
