import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getPublishedProjects } from "@/db/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Projects",
  description: "Engineering projects, documented over time.",
};

export default async function ProjectsPage() {
  const projects = await getPublishedProjects();

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-6 text-2xl font-semibold">Projects</h1>

      {projects.length === 0 ? (
        <p className="text-black/60 dark:text-white/60">Nothing here yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.slug}`}
              className="flex flex-col overflow-hidden rounded-lg border border-black/10 dark:border-white/10 hover:border-black/30 dark:hover:border-white/30"
            >
              {project.bannerUrl && (
                <Image
                  src={project.bannerUrl}
                  alt={project.title}
                  width={640}
                  height={360}
                  className="h-40 w-full object-cover"
                />
              )}
              <div className="p-4">
                <h2 className="font-medium">{project.title}</h2>
                <p className="mt-1 text-sm text-black/60 dark:text-white/60">{project.summary}</p>
                <p className="mt-2 text-xs uppercase tracking-wide text-black/40 dark:text-white/40">
                  {project.status}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
