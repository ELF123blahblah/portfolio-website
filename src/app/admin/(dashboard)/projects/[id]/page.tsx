import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProjectByIdAdmin } from "@/db/queries";
import { updateProject, deleteProject } from "../actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const projectId = Number(id);
  const project = await getProjectByIdAdmin(projectId);

  if (!project) notFound();

  const updateWithId = updateProject.bind(null, projectId);
  const deleteWithId = deleteProject.bind(null, projectId);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Edit project</h1>
      <form action={updateWithId} className="flex flex-col gap-3 max-w-md">
        <label className="text-sm font-medium">
          Title
          <input
            name="title"
            defaultValue={project.title}
            required
            className="mt-1 w-full rounded-md border border-black/15 dark:border-white/15 bg-transparent px-3 py-2"
          />
        </label>
        <label className="text-sm font-medium">
          Slug
          <input
            name="slug"
            defaultValue={project.slug}
            className="mt-1 w-full rounded-md border border-black/15 dark:border-white/15 bg-transparent px-3 py-2"
          />
        </label>
        <label className="text-sm font-medium">
          Summary
          <textarea
            name="summary"
            defaultValue={project.summary}
            required
            rows={3}
            className="mt-1 w-full rounded-md border border-black/15 dark:border-white/15 bg-transparent px-3 py-2"
          />
        </label>
        <label className="text-sm font-medium">
          Status
          <select
            name="status"
            defaultValue={project.status}
            className="mt-1 w-full rounded-md border border-black/15 dark:border-white/15 bg-transparent px-3 py-2"
          >
            <option value="active">active</option>
            <option value="complete">complete</option>
            <option value="shelved">shelved</option>
          </select>
        </label>
        <label className="text-sm font-medium">
          Started at
          <input
            type="date"
            name="startedAt"
            defaultValue={project.startedAt ?? ""}
            className="mt-1 w-full rounded-md border border-black/15 dark:border-white/15 bg-transparent px-3 py-2"
          />
        </label>
        <label className="text-sm font-medium">
          Tech (comma separated)
          <input
            name="tech"
            defaultValue={(project.tech ?? []).join(", ")}
            className="mt-1 w-full rounded-md border border-black/15 dark:border-white/15 bg-transparent px-3 py-2"
          />
        </label>
        <label className="text-sm font-medium">
          Repo URL
          <input
            name="repoUrl"
            defaultValue={project.repoUrl ?? ""}
            className="mt-1 w-full rounded-md border border-black/15 dark:border-white/15 bg-transparent px-3 py-2"
          />
        </label>
        <label className="text-sm font-medium">
          Banner URL
          <input
            name="bannerUrl"
            defaultValue={project.bannerUrl ?? ""}
            className="mt-1 w-full rounded-md border border-black/15 dark:border-white/15 bg-transparent px-3 py-2"
          />
        </label>
        <label className="text-sm font-medium">
          Sort order
          <input
            type="number"
            name="sortOrder"
            defaultValue={project.sortOrder}
            className="mt-1 w-full rounded-md border border-black/15 dark:border-white/15 bg-transparent px-3 py-2"
          />
        </label>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" name="published" defaultChecked={project.published} />
          Published
        </label>
        <button type="submit" className="self-start rounded-md bg-black text-white dark:bg-white dark:text-black px-4 py-2 font-medium">
          Save
        </button>
      </form>

      <form action={deleteWithId}>
        <button type="submit" className="text-sm text-red-600 hover:underline">
          Delete project
        </button>
      </form>
    </div>
  );
}
