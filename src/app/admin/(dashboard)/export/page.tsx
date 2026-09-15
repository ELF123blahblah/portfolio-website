import type { Metadata } from "next";
import { getAllEntryImagesAdmin, getAllProjectsAdmin } from "@/db/queries";
import { ExportClient } from "./export-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function ExportPage() {
  const [images, projects] = await Promise.all([getAllEntryImagesAdmin(), getAllProjectsAdmin()]);

  const serialisable = images.map((img) => ({
    id: img.id,
    url: img.url,
    caption: img.caption,
    entryTitle: img.entryTitle,
    entrySlug: img.entrySlug,
    entryDate: img.entryDate,
    projectId: img.projectId,
    projectTitle: img.projectTitle,
  }));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Export</h1>
      {serialisable.length === 0 ? (
        <p className="text-sm text-black/60 dark:text-white/60">No images yet.</p>
      ) : (
        <ExportClient
          images={serialisable}
          projects={projects.map((p) => ({ id: p.id, title: p.title }))}
        />
      )}
    </div>
  );
}
