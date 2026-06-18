"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light";

/**
 * Minimal day/night toggle. Persists to localStorage and flips the
 * `data-theme` attribute on <html>; the inline script in layout.tsx applies
 * the saved theme before paint so there's no flash.
 */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const initial =
      (document.documentElement.getAttribute("data-theme") as Theme) || "dark";
    setTheme(initial);
    setMounted(true);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("gallery-theme", next);
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className="relative grid h-8 w-8 place-items-center rounded-full border border-line text-muted transition-colors duration-300 hover:border-accent/60 hover:text-ink"
    >
      <span className="sr-only">Toggle theme</span>
      {/* sun / moon crossfade */}
      <svg
        viewBox="0 0 24 24"
        className={`absolute h-4 w-4 transition-all duration-500 ease-gallery ${
          mounted && theme === "light"
            ? "rotate-0 scale-100 opacity-100"
            : "-rotate-90 scale-50 opacity-0"
        }`}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
      <svg
        viewBox="0 0 24 24"
        className={`absolute h-4 w-4 transition-all duration-500 ease-gallery ${
          mounted && theme === "dark"
            ? "rotate-0 scale-100 opacity-100"
            : "rotate-90 scale-50 opacity-0"
        }`}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </svg>
    </button>
  );
}
