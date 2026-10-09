import { redirect } from "next/navigation";

/**
 * In de goedgekeurde septemberstijl heet de start van de bestelling
 * "Bestellen". De huidige webshop toont het volledige (Marie) assortiment
 * zonder eerst een moment te kiezen — dat blijft zo.
 *
 * ?levering=1 of ?levering=0 wordt in de middleware omgezet naar een cookie,
 * zodat de kassa al op leveren of afhalen staat. Zonder middleware land je
 * alsnog in het assortiment.
 */
export default function BestellenPage() {
  redirect("/assortiment");
}
