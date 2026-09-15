import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import JSZip from "jszip";
import { requireAuth } from "@/lib/auth";
import { db } from "@/db";
import { entryImages, journalEntries } from "@/db/schema";
import { inArray, eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const ids = Array.isArray(body?.ids) ? body.ids.map(Number).filter(Number.isFinite) : [];

  if (ids.length === 0) {
    return NextResponse.json({ error: "No images selected" }, { status: 400 });
  }

  const rows = await db
    .select({
      id: entryImages.id,
      url: entryImages.url,
      caption: entryImages.caption,
      entryTitle: journalEntries.title,
      entryDate: journalEntries.entryDate,
    })
    .from(entryImages)
    .innerJoin(journalEntries, eq(entryImages.entryId, journalEntries.id))
    .where(inArray(entryImages.id, ids));

  const zip = new JSZip();
  const manifestLines: string[] = [];

  await Promise.all(
    rows.map(async (row) => {
      const res = await fetch(row.url);
      if (!res.ok) return;
      const buffer = await res.arrayBuffer();
      const extension = row.url.split(".").pop()?.split("?")[0] || "jpg";
      const filename = `${row.id}-${row.entryDate}.${extension}`;
      zip.file(filename, buffer);
      manifestLines.push(`${filename}\t${row.entryTitle}\t${row.entryDate}\t${row.caption}`);
    })
  );

  manifestLines.sort();
  zip.file(
    "captions.txt",
    ["filename\tentry\tdate\tcaption", ...manifestLines].join("\n")
  );

  const zipBytes = await zip.generateAsync({ type: "uint8array" });
  const zipBuffer = new ArrayBuffer(zipBytes.byteLength);
  new Uint8Array(zipBuffer).set(zipBytes);

  return new NextResponse(new Blob([zipBuffer]), {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="export.zip"`,
    },
  });
}
