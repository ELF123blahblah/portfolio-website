import Link from "next/link";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="border-b border-black/10 dark:border-white/10">
        <nav className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link href="/" className="font-semibold">
            Portfolio
          </Link>
          <div className="flex gap-5 text-sm">
            <Link href="/projects">Projects</Link>
            <Link href="/journal">Journal</Link>
            <Link href="/about">About</Link>
          </div>
        </nav>
      </header>
      <div className="flex-1">{children}</div>
      <footer className="border-t border-black/10 dark:border-white/10">
        <div className="mx-auto max-w-4xl px-4 py-6 text-sm text-black/50 dark:text-white/50">
          © {new Date().getFullYear()}
        </div>
      </footer>
    </>
  );
}
