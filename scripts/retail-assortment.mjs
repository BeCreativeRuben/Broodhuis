/**
 * Winkelassortiment uit Marie's WeTransfer (1 okt 2026) en de prijslijst.
 * photo = nummer van de WebP. Alleen het duidelijkste packshot.
 * Actief = prijs staat op de prijslijst. Anders isActive false en
 * "Prijs bevestigen bij Marie" in de beschrijving.
 * Coca-Cola original volgt de prijs van Coca-Cola Zero (€2,50), op vraag van Ruben.
 * Prijzen die Marie later doorgaf: BARÚ-blik €7,95, BARÚ-testzakje €1,50,
 * Rabeko €3,85 (framboos €4,50), OR TEA?-doosje €4,99. Torrefactory blijft open.
 */

export const PRICE_NOTE = "Prijs bevestigen bij Marie.";

export const categories = [
  {
    slug: "thee",
    name: "Thee",
    icon: "🍵",
    sortOrder: 110,
    description: "OR TEA? in doosje of blik, om thuis te zetten.",
  },
  {
    slug: "dranken",
    name: "Dranken",
    icon: "🥤",
    sortOrder: 120,
    description: "Fris, sap, water en chocolademelk om mee te nemen.",
  },
  {
    slug: "zuivel",
    name: "Zuivel",
    icon: "🥛",
    sortOrder: 130,
    description: "Yoghurt, boter, eieren, kaas en melk uit de winkel.",
  },
  {
    slug: "confituur",
    name: "Confituur",
    icon: "🍓",
    sortOrder: 140,
    description: "Confituur om bij het brood te smeren.",
  },
  {
    slug: "snoepgoed",
    name: "Snoepgoed",
    icon: "🍫",
    sortOrder: 150,
    description: "Chocolade en ander lekkers naast het gebak.",
  },
  {
    slug: "ijs",
    name: "IJs",
    icon: "🍨",
    sortOrder: 160,
    description: "IJs en ijstaarten van Missault.",
  },
  {
    slug: "koffie",
    name: "Koffie",
    icon: "☕",
    sortOrder: 170,
    description: "Koffie en warme dranken om thuis te maken.",
  },
];

const TBD = 999;

/**
 * Smaken van OR TEA?. Het losse product blijft in de database (foto + oude slug)
 * maar is niet meer zelf te koop: het wordt een variant van het doosje of het blik.
 * @type {Array<{ slug: string, name: string, priceCents: number, unit: string, description: string, flavors: Array<[string, string]> }>}
 */
export const teaPacks = [
  {
    slug: "or-tea-doosje",
    name: "OR TEA?, doosje",
    priceCents: 499,
    unit: "per doosje",
    description: "Doosje van 10 zakjes. Kies je smaak.",
    flavors: [
      ["or-tea-beeee-calm-doosje", "Beeee Calm"],
      ["or-tea-dragon-jasmine-green-doosje", "Dragon Jasmine Green"],
      ["or-tea-dukes-blues-doosje", "Duke's Blues"],
      ["or-tea-energinger-doosje", "EnerGinger"],
      ["or-tea-lychee-white-peony-doosje", "Lychee White Peony"],
      ["or-tea-merry-peppermint-doosje", "Merry Peppermint"],
      ["or-tea-mount-feather-doosje", "Mount Feather"],
      ["or-tea-playful-pear-doosje", "Playful Pear"],
      ["or-tea-queen-berry-doosje", "Queen Berry"],
      ["or-tea-tiffanys-breakfast-doosje", "Tiffany's Breakfast"],
    ],
  },
  {
    slug: "or-tea-blik",
    name: "OR TEA?, blik",
    priceCents: 1290,
    unit: "per blik",
    description: "Blik om thuis te zetten. Kies je smaak.",
    flavors: [
      ["or-tea-beeee-calm-blik", "Beeee Calm"],
      ["or-tea-energinger-blik", "EnerGinger"],
      ["or-tea-merry-peppermint-blik", "Merry Peppermint"],
      ["or-tea-mount-feather-blik", "Mount Feather"],
      ["or-tea-queen-berry-blik", "Queen Berry"],
    ],
  },
];

/** @type {Array<Record<string, unknown>>} */
export const products = [
  // Thee — één product per verpakking, smaak als variant (zoals een taart).
  tea("or-tea-doosje", "OR TEA?, doosje", 499, "per doosje", 2, "Doosje van 10 zakjes. Kies je smaak."),
  tea("or-tea-blik", "OR TEA?, blik", 1290, "per blik", 3, "Blik om thuis te zetten. Kies je smaak."),

  // Dranken
  drink("coca-cola-zero", "Coca-Cola Zero", 250, "per fles 50 cl", 49, "Fles van 50 cl."),
  drink("fanta-orange", "Fanta orange", 250, "per fles 50 cl", 48, "Fles van 50 cl."),
  drink("lipton-ice-tea", "Lipton ice tea", 250, "per fles 50 cl", 51, "Bruisende ice tea, fles van 50 cl."),
  drink("aquarius-lemon", "Aquarius lemon", 275, "per fles 50 cl", 46, "Fles van 50 cl."),
  drink("aquarius-red-peach", "Aquarius red peach", 275, "per fles 50 cl", 47, "Fles van 50 cl."),
  drink("spa-plat", "Spa plat", 220, "per fles 50 cl", 44, "Spa Reine, plat water, fles van 50 cl."),
  drink("spa-bruisend", "Spa bruisend", 220, "per fles 50 cl", 45, "Spa Intense, bruisend water, fles van 50 cl."),
  drink("cecemel", "Cecemel", 250, "per fles 33 cl", 69, "Chocolademelk, fles van 33 cl.", "melk"),
  drink("chocovit", "Chocovit", 265, "per fles 50 cl", 70, "Chocolademelk, fles van 50 cl.", "melk"),
  drink("red-bull", "Red Bull", 220, "per blik", 42, "Energieblik."),
  drink("nalu", "Nalu", 220, "per blik", 43, "Energieblik, fruity."),
  drink("fruji-citroen", "Fruji citroen", 350, "per fles 25 cl", 56, "Bruisende citroenlimonade, fles van 25 cl."),
  drink("fruji-rabarber", "Fruji rabarber", 350, "per fles 25 cl", 54, "Bruisende rabarberlimonade, fles van 25 cl."),
  drink("fruji-vlierbloesem", "Fruji vlierbloesem", 350, "per fles 25 cl", 52, "Bruisende vlierbloesemlimonade, fles van 25 cl."),
  drink("fruji-pompelmoes-gember", "Fruji pompelmoes & gember", 350, "per fles 75 cl", 58, "Bruisende pompelmoes-gemberlimonade, fles van 75 cl."),
  drink("coca-cola-original", "Coca-Cola original", 250, "per fles 50 cl", 50, "Fles van 50 cl. Zelfde prijs als Coca-Cola Zero."),

  juice("sinaasappelaere", "De Sinaasappelaere", 59),
  juice("appelaere", "De Appelaere", 62),
  juice("perelaere", "De Perelaere", 60),
  juice("druivelaere", "De Druivelaere", 61),

  // Zuivel
  dairy("yoghurt-de-lelie-grenadine", "Yoghurt De Lelie grenadine 0%", 185, "per pot", 82, "Yoghurt van De Lelie, grenadine 0%.", "melk"),
  dairy("yoghurt-de-lelie-kers", "Yoghurt De Lelie kers", 185, "per pot", 83, "Yoghurt van De Lelie, kers.", "melk"),
  dairy("yoghurt-de-lelie-aardbei", "Yoghurt De Lelie aardbei", 185, "per pot", 84, "Yoghurt van De Lelie, aardbei.", "melk"),
  dairy("yoghurt-de-lelie-perzik-passie", "Yoghurt De Lelie perzik-passievrucht", 185, "per pot", 85, "Yoghurt van De Lelie, perzik en passievrucht.", "melk"),
  dairy("becel-original", "Becel Original", 385, "per kuip", 88, "Margarine Becel Original."),
  dairy("berkenhof-scharreleieren", "Berkenhof scharreleieren", 295, "per doosje (6 stuks)", 104, "Doosje van 6 scharreleieren.", "eieren"),
  dairy("berkenhof-goei-boter-gezouten", "Berkenhof Goei Boter gezouten", 440, "per stuk", 105, "Gezouten roomboter van Berkenhof.", "melk"),
  dairy("berkenhof-goei-boter-ongezouten", "Berkenhof Goei Boter ongezouten", 440, "per stuk", 106, "Ongezouten roomboter van Berkenhof.", "melk"),
  dairy("klaartjes-kaas-jong", "Klaartjes Kaas jong", 2233, "per kg", 73, "Romig jong. De prijs is per kilogram.", "melk"),
  dairy("klaartjes-kaas-belegen", "Klaartjes Kaas belegen", 2608, "per kg", 74, "Pittig belegen. De prijs is per kilogram.", "melk"),
  dairy("klaartjes-kaas-oud", "Klaartjes Kaas oud", 3274, "per kg", 72, "Perfect oud. De prijs is per kilogram.", "melk"),
  dairy("inex-halfvolle-melk", "Inex halfvolle melk", 165, "per fles 500 ml", 86, "Halfvolle Inex-melk, fles van 500 ml.", "melk"),
  dairy("inex-volle-melk", "Inex volle melk", 220, "per fles", 87, "Volle Inex-melk. De fles is 900 ml; dat sluit het dichtst aan bij de literprijs van €2,20.", "melk"),

  // Confituur — Marie: €3,85, framboos €4,50
  jam("rabeko-light-aardbei", "Rabeko Light aardbei", 385, 63, "Lichte confituur, aardbei."),
  jam("rabeko-light-zwarte-kers", "Rabeko Light zwarte kers", 385, 64, "Lichte confituur, zwarte kers."),
  jam("rabeko-light-pruim", "Rabeko Light pruim", 385, 65, "Lichte confituur, pruim."),
  jam("rabeko-light-abrikoos", "Rabeko Light abrikoos", 385, 66, "Lichte confituur, abrikoos."),
  jam("rabeko-light-framboos", "Rabeko Light framboos", 450, 67, "Lichte confituur, framboos."),
  jam("rabeko-light-bosvruchten", "Rabeko Light bosvruchten", 385, 68, "Lichte confituur, bosvruchten."),

  // Snoepgoed — mixfoto's, geen losse tablet
  pending("snoepgoed", "chocoladetabletten", "Chocoladetabletten", "per tablet", 71, "De foto toont een mix van tabletten, niet één smaak. Op de prijslijst staan losse tabletten van €3,95 tot €4,95.", "melk"),
  pending("snoepgoed", "fruitgelei", "Fruitgelei", "per stuk", 75, "Assortiment fruitgelei. Staat niet als aparte regel op de prijslijst."),

  // IJs — potjes 100 ml €1,95
  ice("missault-vanille", "Missault vanille", 195, "per potje (100 ml)", 91, "Vanille-ijs in een potje van 100 ml.", "melk"),
  ice("missault-chocolade", "Missault chocolade", 195, "per potje (100 ml)", 92, "Chocolade-ijs in een potje van 100 ml.", "melk"),
  ice("missault-aardbei", "Missault aardbei", 195, "per potje (100 ml)", 93, "Aardbei-ijs in een potje van 100 ml.", "melk"),
  ice("missault-beker-chocoladesaus", "Missault swirl dame blanche", 295, "per beker (140 ml)", 94, "Swirl dame blanche, beker van 140 ml.", "melk"),
  ice("missault-beker-karamel", "Missault swirl caramel-speculoos", 295, "per beker (140 ml)", 95, "Swirl caramel-speculoos, beker van 140 ml.", "melk"),
  ice("missault-ijsjes", "Missault Frisco's (6 stuks)", 1680, "per doos (6 stuks)", 96, "Doos Frisco's van 6 stuks. De foto toont de smaken.", "melk,noten"),
  ice("missault-ijstaart-framboos-meringue", "Missault framboisier (9 personen)", 2995, "per taart", 97, "Ijstaart framboisier voor 9 personen.", "melk,eieren"),
  ice("missault-ijstaart-rood-fruit", "Missault framboise (10 personen)", 3000, "per taart", 98, "Ijstaart framboise voor 10 personen.", "melk"),
  ice("missault-ijstaart-passie", "Missault passion taart (6 personen)", 2600, "per taart", 99, "Passiontaart voor 6 personen.", "melk"),
  ice("missault-portie-chocolade", "Missault portie chocolat suikervrij", 415, "per stuk", 100, "Suikervrije chocoladeportie.", "melk"),
  ice("missault-portie-wit", "Missault portie tarte citron", 415, "per stuk", 101, "Portie tarte citron.", "melk"),
  ice("missault-portie-noten", "Missault portie Brésil", 415, "per stuk", 102, "Portie Brésil.", "melk,noten"),
  pending("ijs", "missault-portie-framboos", "Missault portie met frambozen", "per stuk", 103, "Roomgebakje met frambozen, geen naam die op de lijst past.", "melk"),

  // BARÚ — Marie: blik €7,95, testzakje €1,50. Torrefactory blijft open.
  coffee("baru-spiced-chai-latte", "BARÚ spiced chai latte", 795, "per blik", 26, "Blik chai latte."),
  coffee("baru-spiced-chai-latte-testzakje", "BARÚ spiced chai latte, testzakje", 150, "per zakje", 27, "Testzakje voor één portie."),
  coffee("baru-vanilla-chai-latte", "BARÚ vanilla chai latte", 795, "per blik", 29, "Blik vanilla chai latte."),
  coffee("baru-vanilla-chai-latte-testzakje", "BARÚ vanilla chai latte, testzakje", 150, "per zakje", 30, "Testzakje voor één portie."),
  coffee("baru-matcha-latte", "BARÚ matcha latte", 795, "per blik", 32, "Blik matcha latte."),
  coffee("baru-matcha-latte-testzakje", "BARÚ matcha latte, testzakje", 150, "per zakje", 33, "Testzakje voor één portie."),
  coffee("baru-pure-chocolade", "BARÚ pure warme chocolade", 795, "per blik", 35, "Blik dark hot chocolate."),
  coffee("baru-pure-chocolade-testzakje", "BARÚ pure warme chocolade, testzakje", 150, "per zakje", 36, "Testzakje voor één portie."),
  coffee("baru-swirly-chocolade", "BARÚ swirly warme chocolade", 795, "per blik", 37, "Blik swirly hot chocolate."),
  coffee("baru-swirly-chocolade-testzakje", "BARÚ swirly warme chocolade, testzakje", 150, "per zakje", 38, "Testzakje voor één portie."),
  coffee("baru-pumpkin-spice-latte", "BARÚ pumpkin spice latte", 795, "per blik", 39, "Blik pumpkin spice latte."),
  coffee("baru-pumpkin-spice-latte-testzakje", "BARÚ pumpkin spice latte, testzakje", 150, "per zakje", 40, "Testzakje voor één portie."),
  pending("koffie", "torrefactory-moka", "Torrefactory Moka Blend", "per pak", 89, "Gemalen koffie, Moka Blend."),
  pending("koffie", "torrefactory-espresso-bio", "Torrefactory Espresso Bio", "per pak", 90, "Gemalen koffie, Espresso Bio Blend."),
];

function tea(slug, name, priceCents, unit, photo, description) {
  return item("thee", slug, name, priceCents, unit, photo, true, description, "");
}
function drink(slug, name, priceCents, unit, photo, description, allergens = "") {
  return item("dranken", slug, name, priceCents, unit, photo, true, description, allergens);
}
function dairy(slug, name, priceCents, unit, photo, description, allergens = "") {
  return item("zuivel", slug, name, priceCents, unit, photo, true, description, allergens);
}
function ice(slug, name, priceCents, unit, photo, description, allergens) {
  return item("ijs", slug, name, priceCents, unit, photo, true, description, allergens);
}
function jam(slug, name, priceCents, photo, description) {
  return item("confituur", slug, name, priceCents, "per pot", photo, true, description, "");
}
function coffee(slug, name, priceCents, unit, photo, description) {
  return item("koffie", slug, name, priceCents, unit, photo, true, description, "");
}
function pending(category, slug, name, unit, photo, why, allergens = "") {
  return item(category, slug, name, TBD, unit, photo, false, `${PRICE_NOTE} ${why}`, allergens);
}
function juice(slugBase, name, photo) {
  const note = "De foto toont de flessen van dit sap, ook de maat die je bestelt.";
  return [
    drink(`${slugBase}-33cl`, `${name} 33 cl`, 350, "per fles 33 cl", photo, note),
    drink(`${slugBase}-75cl`, `${name} 75 cl`, 495, "per fles 75 cl", photo, note),
  ];
}
function item(category, slug, name, priceCents, unit, photo, active, description, allergens) {
  return { category, slug, name, priceCents, unit, photo, active, description, allergens };
}

// juice() returns pairs; flatten
export const catalog = products.flat();
