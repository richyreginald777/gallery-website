import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "@fontsource-variable/fraunces";
import "@fontsource-variable/inter";
import "./globals.css";
import Header from "@/components/Header";
import CursorStars from "@/components/CursorStars";

export const metadata: Metadata = {
  title: "The Gallery — Original Artwork",
  description:
    "Original works by a single hand. One-of-a-kind pieces, shipped from the studio.",
};

export const viewport: Viewport = {
  themeColor: "#0d0c0b",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <CursorStars />
        <Header />
        <main className="min-h-screen">{children}</main>
        <footer className="border-t border-line">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-12 sm:flex-row sm:items-end sm:justify-between sm:px-6">
            <div>
              <p className="font-serif text-lg text-ink">The Gallery</p>
              <p className="mt-1 max-w-xs text-sm leading-relaxed text-faint">
                Original works by a single hand. Each piece is one of one —
                once it&apos;s gone, it&apos;s gone.
              </p>
            </div>
            <div className="text-xs text-faint">
              <p>Secure payments via UPI · Razorpay</p>
              <p className="mt-1">
                © {new Date().getFullYear()} The Gallery ·{" "}
                <Link href="/" className="link-quiet">
                  Browse the collection
                </Link>
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
