import Link from "next/link";
import type { Metadata } from "next";
import { getAllEntriesAdmin } from "@/db/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminDashboardPage() {
  const entries = await getAllEntriesAdmin();
  const drafts = entries.filter((e) => !e.published);
  const published = entries.filter((e) => e.published);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <Link
          href="/admin/entries/new"
          className="rounded-md bg-black text-white dark:bg-white dark:text-black px-4 py-2 text-sm font-medium"
        >
          New entry
        </Link>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Drafts</h2>
        {drafts.length === 0 ? (
          <p className="text-sm text-black/60 dark:text-white/60">No drafts.</p>
        ) : (
          <EntryList entries={drafts} />
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Recent entries</h2>
        {published.length === 0 ? (
          <p className="text-sm text-black/60 dark:text-white/60">Nothing published yet.</p>
        ) : (
          <EntryList entries={published} />
        )}
      </section>
    </div>
  );
}

function EntryList({
  entries,
}: {
  entries: { id: number; title: string; entryDate: string; published: boolean }[];
}) {
  return (
    <ul className="flex flex-col gap-2">
      {entries.map((entry) => (
        <li key={entry.id} className="flex items-center justify-between rounded-md border border-black/10 dark:border-white/10 px-3 py-2">
          <Link href={`/admin/entries/${entry.id}`} className="font-medium hover:underline">
            {entry.title}
          </Link>
          <span className="text-xs text-black/50 dark:text-white/50">{entry.entryDate}</span>
        </li>
      ))}
    </ul>
  );
}
