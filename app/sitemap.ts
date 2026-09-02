import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.salonereviews.com";

  return [
    { url: base, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${base}/explore`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/list-business`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/claim`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/signup`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/services/government`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/services/financial`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/services/emergency`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
  ];
}