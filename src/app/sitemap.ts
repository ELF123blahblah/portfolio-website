import type { MetadataRoute } from "next";
import { getPublishedProjects, getPublishedEntries } from "@/db/queries";

export const dynamic = "force-dynamic";

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [projects, entries] = await Promise.all([getPublishedProjects(), getPublishedEntries()]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: new Date() },
    { url: `${base}/projects`, lastModified: new Date() },
    { url: `${base}/journal`, lastModified: new Date() },
    { url: `${base}/about`, lastModified: new Date() },
  ];

  const projectRoutes: MetadataRoute.Sitemap = projects.map((p) => ({
    url: `${base}/projects/${p.slug}`,
    lastModified: p.updatedAt,
  }));

  const entryRoutes: MetadataRoute.Sitemap = entries.map((e) => ({
    url: `${base}/journal/${e.slug}`,
    lastModified: e.updatedAt,
  }));

  return [...staticRoutes, ...projectRoutes, ...entryRoutes];
}
