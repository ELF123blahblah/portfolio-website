import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-2xl font-semibold">About</h1>
      <p className="mt-4 text-black/60 dark:text-white/60">Nothing here yet.</p>
    </main>
  );
}
