/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Serve AVIF/WebP with responsive srcset — big LCP + bandwidth win.
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};

export default nextConfig;
