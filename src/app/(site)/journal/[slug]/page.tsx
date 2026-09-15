import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getPublishedEntryBySlug, getEntryImages, getPublishedProjectById } from "@/db/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = await getPublishedEntryBySlug(slug);
  if (!entry) return {};
  return {
    title: entry.title,
    description: entry.bodyMd.slice(0, 160),
  };
}

export default async function JournalEntryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = await getPublishedEntryBySlug(slug);

  if (!entry) notFound();

  const [images, project] = await Promise.all([
    getEntryImages(entry.id),
    entry.projectId ? getPublishedProjectById(entry.projectId) : Promise.resolve(null),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-sm text-black/50 dark:text-white/50">{entry.entryDate}</p>
      <h1 className="mb-2 text-2xl font-semibold">{entry.title}</h1>
      {project && (
        <p className="mb-6 text-sm">
          Part of{" "}
          <Link href={`/projects/${project.slug}`} className="underline">
            {project.title}
          </Link>
        </p>
      )}

      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{entry.bodyMd}</ReactMarkdown>
      </article>

      {images.length > 0 && (
        <div className="mt-10 flex flex-col gap-6">
          {images.map((image) => (
            <figure key={image.id}>
              <Image
                src={image.url}
                alt={image.caption}
                width={800}
                height={600}
                className="w-full rounded-md object-cover"
              />
              <figcaption className="mt-2 text-sm text-black/60 dark:text-white/60">
                {image.caption}
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </main>
  );
}
