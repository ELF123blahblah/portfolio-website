import Link from "next/link";
import { logout } from "../logout-actions";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-black/10 dark:border-white/10">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <nav className="flex gap-4 text-sm">
            <Link href="/admin" className="font-semibold">
              Dashboard
            </Link>
            <Link href="/admin/projects">Projects</Link>
            <Link href="/admin/export">Export</Link>
          </nav>
          <form action={logout}>
            <button type="submit" className="text-sm text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white">
              Log out
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
    </div>
  );
}
