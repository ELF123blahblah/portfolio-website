import Link from "next/link";
import { getPublishedEntries } from "@/db/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const recentEntries = (await getPublishedEntries()).slice(0, 5);

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-semibold">Hi, I&apos;m building things.</h1>
      <p className="mt-4 max-w-xl text-black/70 dark:text-white/70">
        This is a running archive of engineering work — projects and the journal
        entries that document how they were built.
      </p>
      <Link
        href="/projects"
        className="mt-6 inline-block rounded-md bg-black text-white dark:bg-white dark:text-black px-4 py-2 text-sm font-medium"
      >
        View projects
      </Link>

      <h2 className="mt-16 mb-4 text-lg font-semibold">Recent journal entries</h2>
      {recentEntries.length === 0 ? (
        <p className="text-black/60 dark:text-white/60">Nothing here yet.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {recentEntries.map((entry) => (
            <li key={entry.id}>
              <Link href={`/journal/${entry.slug}`} className="font-medium hover:underline">
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
