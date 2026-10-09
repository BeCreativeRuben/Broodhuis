import { BAKERY_TIME_ZONE, type IsoDate } from "@/lib/datetime";

/**
 * Alles wat de bakkerij zelf bepaalt staat hier bij elkaar.
 * Tijdsloten, openingsuren en leveringskosten pas je aan in dit bestand;
 * tijdelijke sluitingsdagen kan Marie zelf ingeven via /admin/instellingen.
 */

export type FulfillmentType = "pickup" | "delivery";

export type ServiceWindow = {
  /** Stabiel id, wordt bij de bestelling bewaard */
  id: string;
  /** 0 = zondag ... 6 = zaterdag */
  weekday: number;
  /** "08:00" */
  start: string;
  /** "12:30" */
  end: string;
  /** Korte omschrijving, bv. "Voormiddag" */
  label: string;
};

export const SHOP = {
  name: "'t Broodhuis",
  legalName: "Bakkerij 't Broodhuis",
  tagline: "Hét adres voor dagvers brood & banket",
  street: "Sint-Franciscusstraat 4",
  postalCode: "9250",
  city: "Waasmunster",
  phone: "052 51 95 39",
  /** Klikbaar telefoonnummer voor mobiel */
  phoneHref: "+3252519539",
  /**
   * De contactpagina toont geen e-mailadres, alleen telefoon, adres en
   * Messenger (https://bakkerij-tbroodhuis.be/assortiment-2/). Leeg laten.
   */
  email: "",
  website: "https://bakkerij-tbroodhuis.be",
  facebook: "https://www.facebook.com/bakkerijtbroodhuis",
  instagram: "https://www.instagram.com/bakkerij_tbroodhuis/",
  vat: "BE 0751.932.815",
  timeZone: BAKERY_TIME_ZONE,
} as const;

export const FULFILLMENT = {
  /** Vaste leveringskost bovenop de bestelling */
  deliveryFeeCents: 250,

  /**
   * Minimumbedrag voor levering (0 = geen minimum).
   * Zet bv. op 1500 voor "leveren vanaf € 15".
   */
  deliveryMinimumCents: 0,

  /**
   * Postcodes waar we leveren. Voeg buurgemeenten toe als het leveringsgebied
   * groter wordt; klanten buiten de lijst krijgen de vraag om te bellen.
   */
  deliveryPostalCodes: ["9250"],

  /**
   * Tot wanneer kan er besteld worden? Standaard: tot 18:00 de dag vóór het
   * gekozen moment. Zo weet de bakker 's avonds wat er 's morgens moet.
   */
  orderCutoff: { daysBefore: 1, hour: 18 },

  /**
   * Hoe ver vooruit kan een klant een moment kiezen?
   * 13 weken dekt vanaf begin oktober minstens tot 31 december.
   */
  weeksAhead: 13,

  /** Afhaalmomenten — placeholder op basis van een klassiek bakkerijritme. */
  pickupWindows: [
    {
      id: "pickup-wed-am",
      weekday: 3,
      start: "08:00",
      end: "12:30",
      label: "Voormiddag",
    },
    {
      id: "pickup-thu-am",
      weekday: 4,
      start: "08:00",
      end: "12:30",
      label: "Voormiddag",
    },
    {
      id: "pickup-fri-am",
      weekday: 5,
      start: "08:00",
      end: "12:30",
      label: "Voormiddag",
    },
    {
      id: "pickup-sat-am",
      weekday: 6,
      start: "07:30",
      end: "13:00",
      label: "Voormiddag",
    },
    {
      id: "pickup-sun-am",
      weekday: 0,
      start: "07:30",
      end: "12:30",
      label: "Voormiddag",
    },
  ] satisfies ServiceWindow[],

  /** Leveringsmomenten — enkel donderdagvoormiddag, vrijdagnamiddag, zondagvoormiddag. */
  deliveryWindows: [
    {
      id: "delivery-thu-am",
      weekday: 4,
      start: "09:00",
      end: "12:00",
      label: "Voormiddag",
    },
    {
      id: "delivery-fri-pm",
      weekday: 5,
      start: "13:30",
      end: "17:00",
      label: "Namiddag",
    },
    {
      id: "delivery-sun-am",
      weekday: 0,
      start: "09:00",
      end: "12:00",
      label: "Voormiddag",
    },
  ] satisfies ServiceWindow[],

  /**
   * Vaste sluitingsdagen (YYYY-MM-DD). Terugkerende feestdagen zet je hier;
   * losse sluitingsdagen beheert de bakker via de admin.
   */
  closedDates: [] as IsoDate[],
} as const;

/** Dagen waarop de winkel dicht is, afgeleid uit de afhaalmomenten. */
export const CLOSED_WEEKDAYS = [1, 2] as const; // maandag en dinsdag

export function windowsFor(type: FulfillmentType): readonly ServiceWindow[] {
  return type === "delivery"
    ? FULFILLMENT.deliveryWindows
    : FULFILLMENT.pickupWindows;
}

export function findWindow(
  type: FulfillmentType,
  windowId: string,
): ServiceWindow | undefined {
  return windowsFor(type).find((serviceWindow) => serviceWindow.id === windowId);
}

export function fulfillmentLabel(type: FulfillmentType): string {
  return type === "delivery" ? "Levering" : "Afhaling";
}

export function deliversToPostalCode(postalCode: string): boolean {
  const trimmed = postalCode.trim();
  return FULFILLMENT.deliveryPostalCodes.some((code) => code === trimmed);
}
