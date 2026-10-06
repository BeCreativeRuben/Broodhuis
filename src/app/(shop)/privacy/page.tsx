import type { Metadata } from "next";
import Link from "next/link";

import { SHOP } from "@/lib/shop-config";

export const metadata: Metadata = {
  title: "Privacyverklaring",
  description:
    "Privacyverklaring van Bakkerij 't Broodhuis: welke gegevens we vragen bij een online bestelling en wat we ermee doen.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <div className="page-shell py-8 lg:py-12">
      <header className="max-w-2xl space-y-3">
        <p className="eyebrow">Juridisch</p>
        <h1 className="font-heading text-3xl font-semibold sm:text-4xl">
          Privacyverklaring
        </h1>
        <p className="text-muted-foreground">
          Deze verklaring legt uit welke persoonsgegevens {SHOP.legalName}{" "}
          verzamelt wanneer je online bestelt, en waarom.
        </p>
      </header>

      <div className="mt-10 max-w-2xl space-y-8 text-sm">
        <section className="space-y-2">
          <h2 className="font-heading text-xl font-semibold">
            1. Verwerkingsverantwoordelijke
          </h2>
          <p>
            {SHOP.legalName}
            <br />
            {SHOP.street}, {SHOP.postalCode} {SHOP.city}
            <br />
            Ondernemingsnummer / btw: {SHOP.vat}
            <br />
            Telefoon: {SHOP.phone}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-heading text-xl font-semibold">
            2. Welke gegevens we vragen
          </h2>
          <p>Bij een bestelling vragen we:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>naam</li>
            <li>e-mailadres</li>
            <li>telefoonnummer</li>
            <li>
              bij levering: straat, huisnummer, postcode, gemeente en eventuele
              bezorginstructies
            </li>
            <li>de inhoud van je bestelling en een optionele opmerking</li>
          </ul>
          <p>
            De betaling loopt via een externe betaalpagina. Wij zien of bewaren
            je kaart- of rekeningnummer niet.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-heading text-xl font-semibold">
            3. Waarom we die gegevens gebruiken
          </h2>
          <p>
            We gebruiken ze om je bestelling uit te voeren (afhalen of leveren),
            om je te bereiken bij een vraag over de bestelling, en om de
            betaling en administratie te volgen. De grondslag is de uitvoering
            van de overeenkomst, en waar nodig ons gerechtvaardigd belang om de
            bakkerij te runnen. We gebruiken je gegevens niet voor nieuwsbrieven
            of profilering.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-heading text-xl font-semibold">
            4. Hoe lang we bewaren
          </h2>
          <p>
            Bestelgegevens bewaren we zolang nodig om je bestelling uit te
            voeren, en daarna zolang de wettelijke boekhoudplicht dat vraagt.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-heading text-xl font-semibold">
            5. Met wie we gegevens delen
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              de betaalprovider (Mollie), enkel wat nodig is om te betalen
            </li>
            <li>
              de hoster van de webshop (Vercel), zodat de site kan draaien
            </li>
          </ul>
          <p>We verkopen je gegevens niet.</p>
        </section>

        <section className="space-y-2">
          <h2 className="font-heading text-xl font-semibold">6. Cookies</h2>
          <p>
            De webshop bewaart je winkelwagen en een concept van het
            afrekenformulier in je browser (functionele opslag). Zonder die
            opslag werkt bestellen niet. We plaatsen geen tracking- of
            marketingcookies.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-heading text-xl font-semibold">7. Jouw rechten</h2>
          <p>
            Je kan je gegevens inkijken, laten verbeteren of — waar de wet dat
            toelaat — laten wissen. Je kan ook een klacht indienen bij de
            Gegevensbeschermingsautoriteit (www.gegevensbeschermingsautoriteit.be).
            Contacteer ons daarvoor op {SHOP.phone} of in de winkel op{" "}
            {SHOP.street}, {SHOP.postalCode} {SHOP.city}.
          </p>
        </section>

        <p className="text-muted-foreground">
          De{" "}
          <Link href="/voorwaarden" className="underline hover:text-foreground">
            bestel- en betaalvoorwaarden
          </Link>{" "}
          staan apart. Praktische info over afhalen en leveren vind je{" "}
          <Link href="/info" className="underline hover:text-foreground">
            hier
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
