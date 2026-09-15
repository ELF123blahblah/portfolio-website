"use server";

import { and, eq, ne } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { db } from "@/db";
import { projects, PROJECT_STATUSES, type ProjectStatus } from "@/db/schema";
import { slugify } from "@/lib/slug";

function parseStatus(raw: FormDataEntryValue | null): ProjectStatus {
  const value = String(raw ?? "active");
  return (PROJECT_STATUSES as readonly string[]).includes(value)
    ? (value as ProjectStatus)
    : "active";
}

async function uniqueSlug(base: string, excludeId?: number): Promise<string> {
  const baseSlug = slugify(base) || "project";
  let candidate = baseSlug;
  let suffix = 2;

  for (;;) {
    const conditions = excludeId
      ? and(eq(projects.slug, candidate), ne(projects.id, excludeId))
      : eq(projects.slug, candidate);
    const existing = await db.select({ id: projects.id }).from(projects).where(conditions).limit(1);
    if (existing.length === 0) return candidate;
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

function parseTech(raw: string): string[] {
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export async function createProject(formData: FormData): Promise<void> {
  await requireAuth();

  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const status = parseStatus(formData.get("status"));

  if (!title || !summary) {
    throw new Error("Title and summary are required");
  }

  const slug = await uniqueSlug(title);

  await db.insert(projects).values({
    slug,
    title,
    summary,
    status,
    published: false,
  });

  revalidatePath("/admin/projects");
  redirect("/admin/projects");
}

export async function updateProject(id: number, formData: FormData): Promise<void> {
  await requireAuth();

  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const status = parseStatus(formData.get("status"));
  const startedAt = String(formData.get("startedAt") ?? "") || null;
  const tech = parseTech(String(formData.get("tech") ?? ""));
  const repoUrl = String(formData.get("repoUrl") ?? "").trim() || null;
  const bannerUrl = String(formData.get("bannerUrl") ?? "").trim() || null;
  const sortOrder = Number(formData.get("sortOrder") ?? 0) || 0;
  const published = formData.get("published") === "on";

  if (!title || !summary) {
    throw new Error("Title and summary are required");
  }

  const slug = await uniqueSlug(slugInput || title, id);

  await db
    .update(projects)
    .set({
      title,
      summary,
      slug,
      status,
      startedAt,
      tech,
      repoUrl,
      bannerUrl,
      sortOrder,
      published,
      updatedAt: new Date(),
    })
    .where(eq(projects.id, id));

  revalidatePath("/admin/projects");
  revalidatePath(`/admin/projects/${id}`);
  revalidatePath("/projects");
  revalidatePath(`/projects/${slug}`);
}

export async function deleteProject(id: number): Promise<void> {
  await requireAuth();

  await db.delete(projects).where(eq(projects.id, id));

  revalidatePath("/admin/projects");
  revalidatePath("/projects");
  redirect("/admin/projects");
}
