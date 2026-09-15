import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "./index";
import { entryImages, journalEntries, projects } from "./schema";

// --- Public reads: every one of these MUST filter published = true. ---

export function getPublishedProjects() {
  return db
    .select()
    .from(projects)
    .where(eq(projects.published, true))
    .orderBy(asc(projects.sortOrder), desc(projects.createdAt));
}

export async function getPublishedProjectBySlug(slug: string) {
  const rows = await db
    .select()
    .from(projects)
    .where(and(eq(projects.slug, slug), eq(projects.published, true)))
    .limit(1);
  return rows[0] ?? null;
}

// Used to resolve a journal entry's parent project for display — must stay
// published-filtered so a published entry never reveals a draft project's
// title/slug (the two `published` flags are independent).
export async function getPublishedProjectById(id: number) {
  const rows = await db
    .select({ id: projects.id, title: projects.title, slug: projects.slug })
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.published, true)))
    .limit(1);
  return rows[0] ?? null;
}

export function getPublishedEntries(projectId?: number) {
  const conditions = projectId
    ? and(eq(journalEntries.published, true), eq(journalEntries.projectId, projectId))
    : eq(journalEntries.published, true);

  return db
    .select()
    .from(journalEntries)
    .where(conditions)
    .orderBy(desc(journalEntries.entryDate));
}

export async function getPublishedEntryBySlug(slug: string) {
  const rows = await db
    .select()
    .from(journalEntries)
    .where(and(eq(journalEntries.slug, slug), eq(journalEntries.published, true)))
    .limit(1);
  return rows[0] ?? null;
}

export function getEntryImages(entryId: number) {
  return db
    .select()
    .from(entryImages)
    .where(eq(entryImages.entryId, entryId))
    .orderBy(asc(entryImages.sortOrder));
}

// --- Admin reads: no published filter — the caller is already behind auth. ---

export function getAllProjectsAdmin() {
  return db.select().from(projects).orderBy(asc(projects.sortOrder), desc(projects.createdAt));
}

export async function getProjectByIdAdmin(id: number) {
  const rows = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  return rows[0] ?? null;
}

export function getAllEntriesAdmin() {
  return db.select().from(journalEntries).orderBy(desc(journalEntries.entryDate));
}

export async function getEntryByIdAdmin(id: number) {
  const rows = await db
    .select()
    .from(journalEntries)
    .where(eq(journalEntries.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function getAllEntryImagesAdmin() {
  return db
    .select({
      id: entryImages.id,
      entryId: entryImages.entryId,
      url: entryImages.url,
      caption: entryImages.caption,
      sortOrder: entryImages.sortOrder,
      createdAt: entryImages.createdAt,
      entryTitle: journalEntries.title,
      entrySlug: journalEntries.slug,
      entryDate: journalEntries.entryDate,
      projectId: journalEntries.projectId,
      projectTitle: projects.title,
    })
    .from(entryImages)
    .innerJoin(journalEntries, eq(entryImages.entryId, journalEntries.id))
    .leftJoin(projects, eq(journalEntries.projectId, projects.id))
    .orderBy(desc(journalEntries.entryDate), asc(entryImages.sortOrder));
}
