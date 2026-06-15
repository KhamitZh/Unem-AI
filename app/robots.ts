import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/landing", "/analytics", "/books", "/currency", "/deposits", "/inflation", "/investment"],
      disallow: ["/admin", "/api/", "/auth"],
    },
    sitemap: "https://unem-ai.vercel.app/sitemap.xml",
  }
}
