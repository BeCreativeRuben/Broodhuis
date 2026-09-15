import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 is een native module: die moet Next.js laten staan in plaats
  // van bundelen. Bij een overstap naar Postgres kan dit weg (of vervang de
  // adapter door @prisma/adapter-pg).
  serverExternalPackages: [
    "better-sqlite3",
    "@prisma/adapter-better-sqlite3",
    "@prisma/client",
  ],
  images: {
    // Productfoto's staan lokaal in /public. Wil de bakker foto's van een
    // externe host (of Vercel Blob) gebruiken, voeg de host hier toe.
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
  experimental: {
    // Serveracties krijgen foto-uploads binnen; standaardlimiet is 1 MB.
    serverActions: { bodySizeLimit: "6mb" },
  },
};

export default nextConfig;
