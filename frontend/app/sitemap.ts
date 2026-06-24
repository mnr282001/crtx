import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://crtx.chat",
      lastModified: new Date("2026-06-23"),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: "https://crtx.chat/privacy",
      lastModified: new Date("2026-06-23"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: "https://crtx.chat/terms",
      lastModified: new Date("2026-06-23"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
