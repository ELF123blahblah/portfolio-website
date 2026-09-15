"use server";

import { and, eq, ne } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { del } from "@vercel/blob";
import { requireAuth } from "@/lib/auth";
import { db } from "@/db";
import { entryImages, journalEntries } from "@/db/schema";
import { slugify } from "@/lib/slug";

async function uniqueSlug(base: string, excludeId?: number): Promise<string> {
  const baseSlug = slugify(base) || "entry";
  let candidate = baseSlug;
  let suffix = 2;

  for (;;) {
    const conditions = excludeId
      ? and(eq(journalEntries.slug, candidate), ne(journalEntries.id, excludeId))
      : eq(journalEntries.slug, candidate);
    const existing = await db.select({ id: journalEntries.id }).from(journalEntries).where(conditions).limit(1);
    if (existing.length === 0) return candidate;
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

export async function createEntry(formData: FormData): Promise<void> {
  await requireAuth();

  const title = String(formData.get("title") ?? "").trim();
  const bodyMd = String(formData.get("bodyMd") ?? "");
  const entryDate = String(formData.get("entryDate") ?? "");
  const projectIdRaw = formData.get("projectId");
  const projectId = projectIdRaw && projectIdRaw !== "" ? Number(projectIdRaw) : null;

  if (!title || !entryDate) {
    throw new Error("Title and entry date are required");
  }

  const slug = await uniqueSlug(title);

  const [entry] = await db
    .insert(journalEntries)
    .values({
      slug,
      title,
      bodyMd,
      entryDate,
      projectId,
      published: false,
    })
    .returning({ id: journalEntries.id });

  revalidatePath("/admin");
  redirect(`/admin/entries/${entry.id}`);
}

export async function updateEntry(id: number, formData: FormData): Promise<void> {
  await requireAuth();

  const title = String(formData.get("title") ?? "").trim();
  const bodyMd = String(formData.get("bodyMd") ?? "");
  const entryDate = String(formData.get("entryDate") ?? "");
  const slugInput = String(formData.get("slug") ?? "").trim();
  const projectIdRaw = formData.get("projectId");
  const projectId = projectIdRaw && projectIdRaw !== "" ? Number(projectIdRaw) : null;
  const published = formData.get("published") === "on";

  if (!title || !entryDate) {
    throw new Error("Title and entry date are required");
  }

  const slug = await uniqueSlug(slugInput || title, id);

  await db
    .update(journalEntries)
    .set({
      title,
      bodyMd,
      entryDate,
      slug,
      projectId,
      published,
      updatedAt: new Date(),
    })
    .where(eq(journalEntries.id, id));

  revalidatePath("/admin");
  revalidatePath(`/admin/entries/${id}`);
  revalidatePath("/journal");
  revalidatePath(`/journal/${slug}`);
}

export async function deleteEntry(id: number): Promise<void> {
  await requireAuth();

  const images = await db
    .select({ url: entryImages.url })
    .from(entryImages)
    .where(eq(entryImages.entryId, id));

  // DB row deletion cascades to entry_images regardless of whether the
  // blob delete below succeeds — Blob storage isn't transactional with
  // Postgres, so a failure here can't be allowed to block the entry
  // deletion. Any orphaned blob is a storage-cost issue, not a data-
  // integrity one.
  await db.delete(journalEntries).where(eq(journalEntries.id, id));

  if (images.length > 0) {
    await del(images.map((i) => i.url)).catch(() => {});
  }

  revalidatePath("/admin");
  revalidatePath("/journal");
  redirect("/admin");
}

export async function reorderImage(imageId: number, direction: "up" | "down"): Promise<void> {
  await requireAuth();

  const [image] = await db.select().from(entryImages).where(eq(entryImages.id, imageId)).limit(1);
  if (!image) return;

  const siblings = await db
    .select()
    .from(entryImages)
    .where(eq(entryImages.entryId, image.entryId))
    .orderBy(entryImages.sortOrder);

  const index = siblings.findIndex((s) => s.id === imageId);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= siblings.length) return;

  const other = siblings[swapIndex];

  await db.update(entryImages).set({ sortOrder: other.sortOrder }).where(eq(entryImages.id, image.id));
  await db.update(entryImages).set({ sortOrder: image.sortOrder }).where(eq(entryImages.id, other.id));

  revalidatePath(`/admin/entries/${image.entryId}`);
}

export async function deleteImage(imageId: number): Promise<void> {
  await requireAuth();

  const [image] = await db.select().from(entryImages).where(eq(entryImages.id, imageId)).limit(1);
  if (!image) return;

  await db.delete(entryImages).where(eq(entryImages.id, imageId));
  await del(image.url).catch(() => {});

  revalidatePath(`/admin/entries/${image.entryId}`);
}
