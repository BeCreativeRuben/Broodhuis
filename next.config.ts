import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pg blijft buiten de bundle: de driver opent zelf TCP-verbindingen naar Neon.
  serverExternalPackages: ["pg", "@prisma/adapter-pg", "@prisma/client"],
  async rewrites() {
    return [{ source: "/favicon.ico", destination: "/icon.svg" }];
  },
  images: {
    // Productfoto's staan lokaal in /public. Wil de bakker foto's van een
    // externe host (of Vercel Blob) gebruiken, voeg de host hier toe.
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
};

export default nextConfig;
