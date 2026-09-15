import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="mt-2 text-black/60 dark:text-white/60">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link href="/" className="mt-6 underline">
        Back home
      </Link>
    </main>
  );
}
