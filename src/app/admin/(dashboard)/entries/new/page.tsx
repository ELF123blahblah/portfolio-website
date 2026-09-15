import type { Metadata } from "next";
import { getAllProjectsAdmin } from "@/db/queries";
import { createEntry } from "../actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function NewEntryPage() {
  const projects = await getAllProjectsAdmin();
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">New entry</h1>
      <form action={createEntry} className="flex flex-col gap-3 max-w-2xl">
        <label className="text-sm font-medium">
          Title
          <input
            name="title"
            required
            autoFocus
            className="mt-1 w-full rounded-md border border-black/15 dark:border-white/15 bg-transparent px-3 py-2"
          />
        </label>
        <label className="text-sm font-medium">
          Entry date (when the work happened)
          <input
            type="date"
            name="entryDate"
            defaultValue={today}
            required
            className="mt-1 w-full rounded-md border border-black/15 dark:border-white/15 bg-transparent px-3 py-2"
          />
        </label>
        <label className="text-sm font-medium">
          Project (optional)
          <select
            name="projectId"
            defaultValue=""
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
            rows={16}
            className="mt-1 w-full rounded-md border border-black/15 dark:border-white/15 bg-transparent px-3 py-2 font-mono text-sm"
          />
        </label>
        <button type="submit" className="self-start rounded-md bg-black text-white dark:bg-white dark:text-black px-4 py-2 font-medium">
          Create draft
        </button>
      </form>
    </div>
  );
}
