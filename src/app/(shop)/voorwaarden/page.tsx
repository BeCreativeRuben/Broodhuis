import type { Metadata } from "next";
import Link from "next/link";

import { formatEuro } from "@/lib/money";
import { FULFILLMENT, SHOP } from "@/lib/shop-config";

export const metadata: Metadata = {
  title: "Bestel- en betaalvoorwaarden",
  description:
    "Bestel- en betaalvoorwaarden van de webshop van Bakkerij 't Broodhuis in Waasmunster: afhalen, leveren, vooraf betalen en herroeping.",
  alternates: { canonical: "/voorwaarden" },
};

export default function TermsPage() {
  return (
    <div className="page-shell py-8 lg:py-12">
      <header className="max-w-2xl space-y-3">
        <p className="eyebrow">Juridisch</p>
        <h1 className="font-heading text-3xl font-semibold sm:text-4xl">
          Bestel- en betaalvoorwaarden
        </h1>
        <p className="text-muted-foreground">
          Deze voorwaarden gelden voor bestellingen via de webshop van{" "}
          {SHOP.legalName}. Waar iets nog niet vastligt, staat dat als{" "}
          <span className="font-medium">[aan te vullen]</span>.
        </p>
      </header>

      <div className="mt-10 max-w-2xl space-y-8 text-sm">
        <section className="space-y-2">
          <h2 className="font-heading text-xl font-semibold">1. Verkoper</h2>
          <p>
            {SHOP.legalName}
            <br />
            {SHOP.street}
            <br />
            {SHOP.postalCode} {SHOP.city}
            <br />
            Ondernemingsnummer / btw: {SHOP.vat}
            <br />
            Telefoon: {SHOP.phone}
            <br />
            E-mail: [aan te vullen]
            <br />
            Rechtsvorm: [aan te vullen]
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-heading text-xl font-semibold">2. Wat je bestelt</h2>
          <p>
            Via deze webshop bestel je brood, gebak en het winkelassortiment voor
            afhaling in de bakkerij of, waar dat kan, voor levering aan huis. De
            producten zijn verse levensmiddelen. Foto&apos;s en omschrijvingen
            zijn ter illustratie; het gebakken resultaat kan licht afwijken.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-heading text-xl font-semibold">
            3. Bestellen en moment kiezen
          </h2>
          <p>
            Je kiest je producten, daarna of je afhaalt of laat leveren, en een
            beschikbaar moment. Bestellen kan tot {FULFILLMENT.orderCutoff.hour}u
            de dag vóór het gekozen moment, tenzij bij het product een langere
            bestelperiode staat. Je kan tot {FULFILLMENT.weeksAhead} weken
            vooruit een moment kiezen. Maandag en dinsdag is de bakkerij
            gesloten.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-heading text-xl font-semibold">
            4. Afhalen en leveren
          </h2>
          <p>
            Afhalen is gratis, in de winkel op {SHOP.street}, {SHOP.postalCode}{" "}
            {SHOP.city}, op de voormiddagen van woensdag tot en met zondag.
          </p>
          <p>
            Leveren kost {formatEuro(FULFILLMENT.deliveryFeeCents)} en kan
            voorlopig enkel in postcode{" "}
            {FULFILLMENT.deliveryPostalCodes.join(", ")}: donderdagvoormiddag,
            vrijdagnamiddag of zondagvoormiddag. Woon je daarbuiten? Bel ons.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-heading text-xl font-semibold">5. Prijzen</h2>
          <p>
            Prijzen staan in euro bij elk product. Of die prijzen inclusief btw
            zijn: [aan te vullen]. Leveringskost komt erbij als je voor leveren
            kiest. We rekenen de winkelwagen altijd opnieuw door op het moment
            van bestellen.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-heading text-xl font-semibold">
            6. Betaling vooraf
          </h2>
          <p>
            Online besteld is online betaald. Je betaalt vooraf via de beveiligde
            betaalpagina (Bancontact of bankkaart). Wij zien je kaartgegevens
            nooit. De bestelling is pas definitief wanneer de betaling gelukt
            is. Daarna krijg je een bestelnummer en een overzichtspagina.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-heading text-xl font-semibold">
            7. Annuleren en herroepingsrecht
          </h2>
          <p>
            Brood, gebak en andere levensmiddelen die snel bederven of die we
            speciaal voor jou bakken, vallen onder de wettelijke uitzondering op
            het herroepingsrecht (boek VI WER). Zodra we begonnen zijn met
            bakken of klaarzetten, kan de bestelling in de regel niet meer
            kosteloos geannuleerd worden.
          </p>
          <p>
            Wil je toch iets wijzigen of annuleren? Bel ons zo snel mogelijk op{" "}
            {SHOP.phone}. Lukt het nog, dan regelen we dat samen. Terugbetaling
            van een al betaalde bestelling: [aan te vullen — hoe en binnen welke
            termijn].
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-heading text-xl font-semibold">8. Klachten</h2>
          <p>
            Niet tevreden? Laat het ons weten via {SHOP.phone} of in de winkel.
            We zoeken graag een oplossing. Geschillen vallen onder Belgisch
            recht, met als bevoegde rechtbanken die van het arrondissement van{" "}
            {SHOP.city} — tenzij dwingend recht anders bepaalt.
          </p>
        </section>

        <p className="text-muted-foreground">
          Meer over afhalen, leveren en betalen lees je op de{" "}
          <Link href="/info" className="underline hover:text-foreground">
            praktische pagina
          </Link>
          . Hoe we je gegevens gebruiken, staat in de{" "}
          <Link href="/privacy" className="underline hover:text-foreground">
            privacyverklaring
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
