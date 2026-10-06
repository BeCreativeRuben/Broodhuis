import {
  CakeIcon,
  CakeSliceIcon,
  CookieIcon,
  CroissantIcon,
  GiftIcon,
  SandwichIcon,
  ShoppingBasketIcon,
  WheatIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Het icoon van een categorie volgt uit haar naam, zodat een categorie die de
 * bakker zelf aanmaakt ("Kerst", "Confiserie") er meteen goed uitziet zonder
 * dat zij iets moet instellen.
 */
const RULES: Array<{ match: RegExp; icon: typeof WheatIcon }> = [
  { match: /belegd|lunch|sandwich(es)?\b/i, icon: SandwichIcon },
  { match: /thee|koffie$|dranken|zuivel|confituur|snoep|ijs/i, icon: ShoppingBasketIcon },
  { match: /koffiekoek|viennoiser/i, icon: CroissantIcon },
  { match: /vlaai|semoule|cake/i, icon: CakeIcon },
  { match: /taart/i, icon: CakeIcon },
  { match: /patisserie|gebak|dessert|pateke/i, icon: CakeSliceIcon },
  { match: /koek|confiserie|praline|chocolat|drooggebak/i, icon: CookieIcon },
  { match: /kerst|paas|feest|seizoen/i, icon: GiftIcon },
  { match: /klein brood|kleingoed|pistolet|broodje/i, icon: CookieIcon },
  { match: /brood|desem|bake?ry/i, icon: WheatIcon },
];

export function categoryIcon(category: { name: string; slug: string }) {
  const haystack = `${category.name} ${category.slug.replace(/-/g, " ")}`;
  return (
    RULES.find((rule) => rule.match.test(haystack))?.icon ?? ShoppingBasketIcon
  );
}

export function CategoryIcon({
  category,
  className,
}: {
  category: { name: string; slug: string };
  className?: string;
}) {
  const Icon = categoryIcon(category);
  return <Icon aria-hidden className={cn("size-5", className)} />;
}
