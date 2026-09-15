import Link from "next/link";
import type { Metadata } from "next";
import { getPublishedEntries } from "@/db/queries";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { projects as projectsTable } from "@/db/schema";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Journal",
  description: "Build journal entries documenting engineering work over time.",
};

export default async function JournalPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const { project: projectSlug } = await searchParams;

  let projectId: number | undefined;
  let activeProjectTitle: string | null = null;

  if (projectSlug) {
    const rows = await db
      .select({ id: projectsTable.id, title: projectsTable.title })
      .from(projectsTable)
      .where(eq(projectsTable.slug, projectSlug))
      .limit(1);
    if (rows[0]) {
      projectId = rows[0].id;
      activeProjectTitle = rows[0].title;
    }
  }

  const entries = await getPublishedEntries(projectId);

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-2 text-2xl font-semibold">Journal</h1>
      {activeProjectTitle && (
        <p className="mb-6 text-sm text-black/60 dark:text-white/60">
          Filtered by project: <span className="font-medium">{activeProjectTitle}</span>{" "}
          · <Link href="/journal" className="underline">clear filter</Link>
        </p>
      )}

      {entries.length === 0 ? (
        <p className="text-black/60 dark:text-white/60">Nothing here yet.</p>
      ) : (
        <ul className="flex flex-col gap-6">
          {entries.map((entry) => (
            <li key={entry.id}>
              <Link href={`/journal/${entry.slug}`} className="text-lg font-medium hover:underline">
                {entry.title}
              </Link>
              <p className="text-sm text-black/50 dark:text-white/50">{entry.entryDate}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
