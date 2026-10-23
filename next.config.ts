import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // pg blijft buiten de bundle: de driver opent zelf TCP-verbindingen naar Neon.
  serverExternalPackages: ["pg", "@prisma/adapter-pg", "@prisma/client"],
  async rewrites() {
    return [{ source: "/favicon.ico", destination: "/icon.svg" }];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
  images: {
    // SVG hoort niet door de optimizer. De RCE van oktober 2026 zit in librsvg.
    dangerouslyAllowSVG: false,
    // Alleen paden die de shop zelf aan next/image geeft. Een los verzoek naar
    // /_next/image met een ander lokaal bestand wordt geweigerd.
    localPatterns: [
      { pathname: "/images/**", search: "" },
      { pathname: "/brand/**", search: "" },
      { pathname: "/uploads/**", search: "" },
    ],
    // Blob-foto's gaan als gewone <img> naar de browser. Een wildcard op
    // *.public.blob.vercel-storage.com zou elk Blob-bestand door de optimizer
    // halen, ook van een vreemde store.
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
};

export default nextConfig;
