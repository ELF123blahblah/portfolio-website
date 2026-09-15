import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { getEntryByIdAdmin, getAllProjectsAdmin, getEntryImages } from "@/db/queries";
import { updateEntry, deleteEntry, deleteImage, reorderImage } from "../actions";
import { UploadForm } from "./upload-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function EditEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entryId = Number(id);
  const [entry, projects, images] = await Promise.all([
    getEntryByIdAdmin(entryId),
    getAllProjectsAdmin(),
    getEntryImages(entryId),
  ]);

  if (!entry) notFound();

  const updateWithId = updateEntry.bind(null, entryId);
  const deleteWithId = deleteEntry.bind(null, entryId);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="mb-4 text-xl font-semibold">Edit entry</h1>
        <form action={updateWithId} className="flex flex-col gap-3 max-w-2xl">
          <label className="text-sm font-medium">
            Title
            <input
              name="title"
              defaultValue={entry.title}
              required
              className="mt-1 w-full rounded-md border border-black/15 dark:border-white/15 bg-transparent px-3 py-2"
            />
          </label>
          <label className="text-sm font-medium">
            Slug
            <input
              name="slug"
              defaultValue={entry.slug}
              className="mt-1 w-full rounded-md border border-black/15 dark:border-white/15 bg-transparent px-3 py-2"
            />
          </label>
          <label className="text-sm font-medium">
            Entry date
            <input
              type="date"
              name="entryDate"
              defaultValue={entry.entryDate}
              required
              className="mt-1 w-full rounded-md border border-black/15 dark:border-white/15 bg-transparent px-3 py-2"
            />
          </label>
          <label className="text-sm font-medium">
            Project
            <select
              name="projectId"
              defaultValue={entry.projectId ?? ""}
              className="mt-1 w-full rounded-md border border-black/15 dark:border-white/15 bg-transparent px-3 py-2"
            >
              <option value="">— none —</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium">
            Body (Markdown)
            <textarea
              name="bodyMd"
              defaultValue={entry.bodyMd}
              rows={16}
              className="mt-1 w-full rounded-md border border-black/15 dark:border-white/15 bg-transparent px-3 py-2 font-mono text-sm"
            />
          </label>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" name="published" defaultChecked={entry.published} />
            Published
          </label>
          <button type="submit" className="self-start rounded-md bg-black text-white dark:bg-white dark:text-black px-4 py-2 font-medium">
            Save
          </button>
        </form>

        <form action={deleteWithId} className="mt-4">
          <button type="submit" className="text-sm text-red-600 hover:underline">
            Delete entry
          </button>
        </form>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Images</h2>
        {images.length === 0 ? (
          <p className="mb-4 text-sm text-black/60 dark:text-white/60">No images yet.</p>
        ) : (
          <ul className="mb-6 flex flex-col gap-3">
            {images.map((image, index) => (
              <li key={image.id} className="flex items-start gap-3 rounded-md border border-black/10 dark:border-white/10 p-3">
                <Image
                  src={image.url}
                  alt={image.caption}
                  width={120}
                  height={90}
                  className="rounded-md object-cover"
                />
                <div className="flex-1">
                  <p className="text-sm">{image.caption}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <form action={reorderImage.bind(null, image.id, "up")}>
                    <button type="submit" disabled={index === 0} className="text-xs disabled:opacity-30">
                      ↑
                    </button>
                  </form>
                  <form action={reorderImage.bind(null, image.id, "down")}>
                    <button type="submit" disabled={index === images.length - 1} className="text-xs disabled:opacity-30">
                      ↓
                    </button>
                  </form>
                  <form action={deleteImage.bind(null, image.id)}>
                    <button type="submit" className="text-xs text-red-600">
                      Delete
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
        <UploadForm entryId={entryId} />
      </div>
    </div>
  );
}
