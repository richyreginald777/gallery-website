import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Art Gallery",
  description: "Original artwork for sale.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <header className="border-b border-neutral-200 bg-white/70 backdrop-blur sticky top-0 z-10">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <Link href="/" className="font-serif text-xl tracking-tight">
              The Gallery
            </Link>
            <div className="flex items-center gap-5 text-sm">
              <Link href="/" className="hover:underline">
                Gallery
              </Link>
              <Link href="/account" className="hover:underline">
                Account
              </Link>
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-6xl px-4 py-12 text-xs text-neutral-400">
          Original artwork. Payments via UPI.
        </footer>
      </body>
    </html>
  );
}
