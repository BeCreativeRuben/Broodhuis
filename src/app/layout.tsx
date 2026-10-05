import type { Metadata, Viewport } from "next";
import { Montserrat, Playfair_Display } from "next/font/google";

import { Toaster } from "@/components/ui/sonner";
import { SHOP } from "@/lib/shop-config";
import { siteUrl } from "@/lib/site-url";

import "./globals.css";

const display = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const body = Montserrat({
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
    "Bakkerij 't Broodhuis is sinds augustus 2020 dé warme bakker bij uitstek voor brood, gebak, confiserie en belegde broodjes. Bestel online in Waasmunster, betaal met Bancontact en haal af of laat leveren.",
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
  themeColor: "#FFFCF6",
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
