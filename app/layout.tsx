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
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script
          // Apply saved theme before paint to avoid a flash of the wrong theme.
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('gallery-theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="relative min-h-screen antialiased">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <CursorStars />
        <Header />
        <main id="main" className="relative z-10 min-h-screen">
          {children}
        </main>
        <footer className="relative z-10 border-t border-line">
          <div className="mx-auto max-w-6xl px-5 sm:px-6">
            {/* Oversized wordmark — typography as a design element */}
            <div className="select-none border-b border-line py-14">
              <p className="font-serif leading-none tracking-tight text-ink/90 text-[clamp(3rem,12vw,9rem)]">
                The&nbsp;Gallery
              </p>
            </div>
            <div className="flex flex-col gap-6 py-12 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="max-w-xs text-sm leading-relaxed text-faint">
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
          </div>
        </footer>
      </body>
    </html>
  );
}
