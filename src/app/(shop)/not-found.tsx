import type { Metadata } from "next";

import { NotFoundContent } from "@/components/not-found-content";

export const metadata: Metadata = {
  title: "Pagina niet gevonden",
  robots: { index: false, follow: false },
};

export default function ShopNotFound() {
  return <NotFoundContent />;
}
