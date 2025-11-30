"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/about", label: "About" },
];

export default function NavBar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname?.startsWith(href);
  };

  return (
    <header className="w-full border-b border-zinc-800 bg-zinc-900/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:flex-nowrap sm:gap-4 sm:px-6 sm:py-4 lg:px-8">
        <Link href="/" className="flex items-center gap-3 font-semibold whitespace-nowrap">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-zinc-800 text-xs tracking-wide sm:text-sm">
            MM
          </span>
          <span className="text-base sm:text-lg">MoneyMap</span>
        </Link>
        <nav className="flex flex-wrap items-center gap-3 text-sm font-medium text-zinc-200 sm:gap-6">
          {links.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`transition ${
                  active
                    ? "text-white underline underline-offset-4"
                    : "text-zinc-300 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
