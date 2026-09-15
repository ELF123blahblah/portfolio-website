import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getPublishedProjectBySlug, getPublishedEntries } from "@/db/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await getPublishedProjectBySlug(slug);
  if (!project) return {};
  return { title: project.title, description: project.summary };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getPublishedProjectBySlug(slug);

  if (!project) notFound();

  const entries = await getPublishedEntries(project.id);

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      {project.bannerUrl && (
        <Image
          src={project.bannerUrl}
          alt={project.title}
          width={960}
          height={480}
          className="mb-6 w-full rounded-lg object-cover"
        />
      )}
      <h1 className="text-2xl font-semibold">{project.title}</h1>
      <p className="mt-2 text-black/70 dark:text-white/70">{project.summary}</p>

      <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-black/60 dark:text-white/60">
        <div>
          <dt className="inline font-medium">Status: </dt>
          <dd className="inline">{project.status}</dd>
        </div>
        {project.startedAt && (
          <div>
            <dt className="inline font-medium">Started: </dt>
            <dd className="inline">{project.startedAt}</dd>
          </div>
        )}
        {project.repoUrl && (
          <div>
            <dt className="inline font-medium">Repo: </dt>
            <dd className="inline">
              <a href={project.repoUrl} className="underline" target="_blank" rel="noopener noreferrer">
                {project.repoUrl}
              </a>
            </dd>
          </div>
        )}
      </dl>

      {project.tech && project.tech.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {project.tech.map((t) => (
            <li key={t} className="rounded-full bg-black/5 dark:bg-white/10 px-3 py-1 text-xs">
              {t}
            </li>
          ))}
        </ul>
      )}

      <h2 className="mt-10 mb-4 text-lg font-semibold">Journal entries</h2>
      {entries.length === 0 ? (
        <p className="text-black/60 dark:text-white/60">Nothing here yet.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {entries.map((entry) => (
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
