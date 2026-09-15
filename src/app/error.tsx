"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="mt-2 text-black/60 dark:text-white/60">Please try again.</p>
      <button onClick={reset} className="mt-6 underline">
        Retry
      </button>
    </main>
  );
}
