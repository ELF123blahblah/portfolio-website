"use server";

import { put } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { db } from "@/db";
import { entryImages } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_BYTES = 15 * 1024 * 1024; // 15 MB

// The browser-reported MIME type (file.type) is attacker-controlled — a
// renamed non-image file would sail through a type-only check. Confirm the
// file's actual magic bytes match one of the allowed formats too. Checked
// against only the admin upload path (single authenticated user), so this
// is defense in depth, not a hard security boundary.
const MAGIC_BYTES: { type: string; signature: number[] }[] = [
  { type: "image/jpeg", signature: [0xff, 0xd8, 0xff] },
  { type: "image/png", signature: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { type: "image/gif", signature: [0x47, 0x49, 0x46, 0x38] },
  // WebP: "RIFF" .... "WEBP" — bytes 8-11 checked separately below.
];

function matchesImageSignature(bytes: Uint8Array, mimeType: string): boolean {
  if (mimeType === "image/webp") {
    const riff = [0x52, 0x49, 0x46, 0x46];
    const webp = [0x57, 0x45, 0x42, 0x50];
    return (
      riff.every((b, i) => bytes[i] === b) && webp.every((b, i) => bytes[i + 8] === b)
    );
  }
  const entry = MAGIC_BYTES.find((m) => m.type === mimeType);
  return entry ? entry.signature.every((b, i) => bytes[i] === b) : false;
}

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

  const headerBytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (!matchesImageSignature(headerBytes, file.type)) {
    return { error: "File content doesn't match an allowed image format." };
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
