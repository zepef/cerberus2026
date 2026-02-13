import Link from "next/link";
import { Shield } from "lucide-react";

export function Header() {
  return (
    <header className="glass sticky top-0 z-50">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3 group">
          <Shield className="h-7 w-7 text-orange-500 transition-transform group-hover:scale-110" />
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">
              CERBERUS <span className="text-orange-500">2026</span>
            </h1>
            <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
              EU Corruption Dashboard
            </p>
          </div>
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="/"
            className="text-sm text-zinc-400 transition-colors hover:text-white"
          >
            Map
          </Link>
          <Link
            href="/entities"
            className="text-sm text-zinc-400 transition-colors hover:text-white"
          >
            Entities
          </Link>
          <Link
            href="/legislation"
            className="text-sm text-zinc-400 transition-colors hover:text-white"
          >
            Legislation
          </Link>
          <Link
            href="/graph"
            className="text-sm text-zinc-400 transition-colors hover:text-white"
          >
            Network
          </Link>
          <Link
            href="/focuspoints"
            className="text-sm text-zinc-400 transition-colors hover:text-white"
          >
            FocusPoints
          </Link>
          <Link
            href="/submit"
            className="text-sm text-orange-400 transition-colors hover:text-orange-300"
          >
            Submit
          </Link>
        </nav>
      </div>
    </header>
  );
}
