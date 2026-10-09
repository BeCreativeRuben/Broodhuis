import { formatTime, WEEKDAY_NAMES_NL } from "@/lib/datetime";
import { formatEuro } from "@/lib/money";
import { FULFILLMENT, SHOP, type ServiceWindow } from "@/lib/shop-config";

export type PracticalFaqLink = {
  /** Exact phrase inside a paragraph that becomes the link. */
  phrase: string;
  href: string;
};

export type PracticalFaqItem = {
  question: string;
  paragraphs: string[];
  link?: PracticalFaqLink;
};

function describeWindow(serviceWindow: ServiceWindow): string {
  const day = WEEKDAY_NAMES_NL[serviceWindow.weekday];
  const moment = serviceWindow.label.toLowerCase();
  return `${day}${moment} (${formatTime(serviceWindow.start)} - ${formatTime(serviceWindow.end)})`;
}

function joinNl(items: readonly string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} en ${items.at(-1)}`;
}

function deliveryArea(): string {
  return FULFILLMENT.deliveryPostalCodes
    .map((code) => (code === SHOP.postalCode ? `${code} ${SHOP.city}` : code))
    .join(", ");
}

/**
 * Antwoorden komen alleen uit shop-config, de praktische pagina en de voorwaarden.
 * Geen extra beleid verzinnen.
 */
export function practicalFaqItems(): PracticalFaqItem[] {
  const pickup = joinNl(FULFILLMENT.pickupWindows.map(describeWindow));
  const delivery = joinNl(FULFILLMENT.deliveryWindows.map(describeWindow));
  const fee = formatEuro(FULFILLMENT.deliveryFeeCents);
  const area = deliveryArea();

  return [
    {
      question: "Wanneer moet ik bestellen?",
      paragraphs: [
        `Dagelijks brood en koffiekoeken bestel je tot ${FULFILLMENT.orderCutoff.hour}u de dag vóór je afhaalt of laat leveren. Zo weet de bakker 's avonds wat er gebakken moet worden.`,
        "Bij producten die meer voorbereiding vragen, staat op de productpagina hoeveel dagen we nodig hebben. Een feesttaart op maat bijvoorbeeld minstens 14 dagen vooraf.",
      ],
    },
    {
      question: "Tot wanneer kan ik vooruit boeken?",
      paragraphs: [
        `Je kan tot ${FULFILLMENT.weeksAhead} weken vooruit een moment kiezen. Vanaf begin oktober reikt dat minstens tot 31 december. Handig voor een feest of een weekend met veel volk.`,
      ],
    },
    {
      question: "Wanneer kan ik afhalen?",
      paragraphs: [
        `Afhalen is gratis, in de winkel op ${SHOP.street}, ${SHOP.postalCode} ${SHOP.city}. Je kiest een voormiddag van woensdag tot en met zondag: ${pickup}.`,
        "Maandag en dinsdag is de winkel gesloten. Openingsuren zijn indicatief — bel ons als je twijfelt.",
      ],
    },
    {
      question: "Wanneer leveren jullie?",
      paragraphs: [
        `Leveren kost ${fee} en kan voorlopig enkel in ${area}: ${delivery}.`,
        `Woon je daarbuiten? Bel ons op ${SHOP.phone}.`,
      ],
    },
    {
      question: "Hoe betaal ik?",
      paragraphs: [
        "Online besteld is online betaald. Je betaalt vooraf met Bancontact of KBC/CBC, via een beveiligde betaalpagina. Wij zien je kaartgegevens nooit.",
        "Je bestelling is pas definitief wanneer de betaling gelukt is — dan krijg je je bestelnummer te zien.",
      ],
    },
    {
      question: "Kan ik wijzigen of annuleren?",
      paragraphs: [
        "Brood, gebak en andere levensmiddelen die snel bederven of die we speciaal voor jou bakken, vallen onder de wettelijke uitzondering op het herroepingsrecht (boek VI WER). Zodra we begonnen zijn met bakken of klaarzetten, kan de bestelling in de regel niet meer kosteloos geannuleerd worden.",
        `Wil je toch iets wijzigen of annuleren? Bel ons zo snel mogelijk op ${SHOP.phone}. Lukt het nog, dan regelen we dat samen. Als we een al betaalde bestelling alsnog annuleren, betalen we het bedrag terug via dezelfde betaalwijze.`,
        "Meer staat in de bestelvoorwaarden.",
      ],
      link: { phrase: "bestelvoorwaarden", href: "/voorwaarden" },
    },
    {
      question: "Hoe zit het met allergenen?",
      paragraphs: [
        "Staat de allergenen-info bij het product, dan zie je welke van de 14 wettelijke allergenen erin zitten. Ontbreekt die nog? Vraag gerust in de winkel.",
        "We bakken alles in dezelfde bakkerij, waar gluten, melk, eieren, noten en sesam gebruikt worden. Sporen zijn daarom nooit volledig uit te sluiten. Heb je een zware allergie? Bel ons, dan bekijken we samen wat kan.",
      ],
    },
  ];
}

export function practicalFaqAnswerText(item: PracticalFaqItem): string {
  return item.paragraphs.join(" ");
}

export function practicalFaqJsonLd(items: readonly PracticalFaqItem[] = practicalFaqItems()) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: practicalFaqAnswerText(item),
      },
    })),
  };
}
