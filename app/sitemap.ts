import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://unem-ai.vercel.app"
  const routes = [
    "/landing",
    "/analytics",
    "/books",
    "/currency",
    "/deposits",
    "/inflation",
    "/investment",
    "/retirement",
    "/community",
    "/leaderboard",
  ]

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "/landing" ? 1 : 0.8,
  }))
}
