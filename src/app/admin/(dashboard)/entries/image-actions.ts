"use server";

import { put } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { db } from "@/db";
import { entryImages } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_BYTES = 15 * 1024 * 1024; // 15 MB

export async function uploadImage(
  entryId: number,
  _prevState: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  await requireAuth();

  const file = formData.get("file");
  const caption = String(formData.get("caption") ?? "").trim();

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose an image file." };
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return { error: "Only JPEG, PNG, WebP, or GIF images are allowed." };
  }
  if (file.size > MAX_BYTES) {
    return { error: "Image is too large (max 15 MB)." };
  }
  if (!caption) {
    return { error: "A caption is required for every image." };
  }

  const blob = await put(`entries/${entryId}/${Date.now()}-${file.name}`, file, {
    access: "public",
  });

  const [{ maxSort } = { maxSort: null }] = await db
    .select({ maxSort: entryImages.sortOrder })
    .from(entryImages)
    .where(eq(entryImages.entryId, entryId))
    .orderBy(desc(entryImages.sortOrder))
    .limit(1);

  await db.insert(entryImages).values({
    entryId,
    url: blob.url,
    caption,
    sortOrder: (maxSort ?? -1) + 1,
  });

  revalidatePath(`/admin/entries/${entryId}`);
  return { error: null };
}
