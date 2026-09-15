import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";

import { Toaster } from "@/components/ui/sonner";
import { SHOP } from "@/lib/shop-config";
import { siteUrl } from "@/lib/site-url";

import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: `${SHOP.name} — vers brood en gebak bestellen in ${SHOP.city}`,
    template: `%s · ${SHOP.name}`,
  },
  description:
    "Bestel online bij Bakkerij 't Broodhuis in Waasmunster: vers brood, koffiekoeken, patisserie en feesttaarten. Afhalen in de winkel of laten leveren.",
  openGraph: {
    type: "website",
    locale: "nl_BE",
    siteName: SHOP.legalName,
    title: `${SHOP.name} — online bestellen`,
    description:
      "Vers brood, koffiekoeken en patisserie uit Waasmunster. Online besteld en betaald, klaar wanneer jij het wil.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#f6efe2",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nl-BE" suppressHydrationWarning>
      <body className={`${display.variable} ${body.variable}`}>
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
