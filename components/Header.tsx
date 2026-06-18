"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";

const LINKS = [
  { href: "/", label: "Gallery" },
  { href: "/account", label: "Account" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(y / max, 1) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ease-gallery ${
        scrolled
          ? "border-b border-line bg-bg/70 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-6">
        <Link
          href="/"
          className="group flex items-center gap-2.5 font-serif text-xl tracking-tight text-ink"
        >
          <span className="grid h-7 w-7 place-items-center rounded-full border border-accent/50 text-[0.6rem] font-medium tracking-widest2 text-accent transition-colors duration-300 group-hover:bg-accent group-hover:text-bg">
            TG
          </span>
          <span className="transition-colors duration-300 group-hover:text-accent">
            The Gallery
          </span>
        </Link>

        <div className="flex items-center gap-5 text-sm sm:gap-7">
          {LINKS.map((l) => {
            const active =
              l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`relative py-1 transition-colors duration-300 ${
                  active ? "text-ink" : "text-muted hover:text-ink"
                }`}
              >
                {l.label}
                <span
                  className={`absolute -bottom-0.5 left-0 h-px bg-accent transition-all duration-500 ease-gallery ${
                    active ? "w-full" : "w-0"
                  }`}
                />
              </Link>
            );
          })}
          <ThemeToggle />
        </div>
      </nav>

      {/* Reading / scroll progress hairline */}
      <div
        className="h-px origin-left bg-accent transition-transform duration-150 ease-out"
        style={{ transform: `scaleX(${progress})` }}
        aria-hidden="true"
      />
    </header>
  );
}
