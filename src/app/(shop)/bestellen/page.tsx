import { redirect } from "next/navigation";

/**
 * In de goedgekeurde septemberstijl heet de start van de bestelling
 * "Bestellen". De huidige webshop toont het volledige (Marie) assortiment
 * zonder eerst een moment te kiezen — dat blijft zo.
 */
export default function BestellenPage() {
  redirect("/assortiment");
}
