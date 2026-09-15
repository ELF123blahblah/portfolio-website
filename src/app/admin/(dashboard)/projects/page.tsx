import Link from "next/link";
import type { Metadata } from "next";
import { getAllProjectsAdmin } from "@/db/queries";
import { createProject } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminProjectsPage() {
  const allProjects = await getAllProjectsAdmin();

  return (
    <div className="flex flex-col gap-10">
      <section>
        <h1 className="mb-4 text-xl font-semibold">Projects</h1>
        {allProjects.length === 0 ? (
          <p className="text-sm text-black/60 dark:text-white/60">No projects yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {allProjects.map((project) => (
              <li key={project.id} className="flex items-center justify-between rounded-md border border-black/10 dark:border-white/10 px-3 py-2">
                <div>
                  <Link href={`/admin/projects/${project.id}`} className="font-medium hover:underline">
                    {project.title}
                  </Link>
                  <span className="ml-2 text-xs text-black/50 dark:text-white/50">
                    {project.status} · {project.published ? "published" : "draft"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">New project</h2>
        <form action={createProject} className="flex flex-col gap-3 max-w-md">
          <input
            name="title"
            placeholder="Title"
            required
            className="rounded-md border border-black/15 dark:border-white/15 bg-transparent px-3 py-2"
          />
          <textarea
            name="summary"
            placeholder="Summary (1-3 sentences)"
            required
            rows={3}
            className="rounded-md border border-black/15 dark:border-white/15 bg-transparent px-3 py-2"
          />
          <select
            name="status"
            defaultValue="active"
            className="rounded-md border border-black/15 dark:border-white/15 bg-transparent px-3 py-2"
          >
            <option value="active">active</option>
            <option value="complete">complete</option>
            <option value="shelved">shelved</option>
          </select>
          <button type="submit" className="self-start rounded-md bg-black text-white dark:bg-white dark:text-black px-4 py-2 font-medium">
            Create
          </button>
        </form>
      </section>
    </div>
  );
}
