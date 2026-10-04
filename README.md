# Webshop Bakkerij ’t Broodhuis

Online besteld en betaald, klaar wanneer de klant het wil. Deze webshop laat
klanten van **Bakkerij ’t Broodhuis** (Sint-Franciscusstraat 4, 9250
Waasmunster) brood, koffiekoeken, patisserie en feesttaarten bestellen, met
keuze tussen **afhalen** en **leveren**, en met betaling **vooraf**.

De bakker beheert het assortiment zelf via een eenvoudige, met een wachtwoord
beveiligde admin — inclusief allergenen, ingrediënten, voorraad, foto’s en
bestelperiodes voor feestdagen en seizoenen.

Dit is **enkel de webshop**. De bestaande merksite blijft zoals ze is; daar kan
later een link naar deze webshop bij.

---

## Snel starten

```bash
npm install
npm run dev
```

Open <http://localhost:4317>. Zet daarvoor `DATABASE_URL` naar Postgres (zie
hieronder). Op Vercel is dat al de Neon-database `neon-broodhuis`
(`STORAGE_DATABASE_URL`); die catalogus wordt niet opnieuw geseed. Zonder
betaalsleutel draait de webshop in **testmodus**: de volledige flow werkt, maar
er wordt geen geld verplaatst.

| Wat | Waar |
| --- | --- |
| Webshop | <http://localhost:4317> |
| Beheer | <http://localhost:4317/admin> |
| Login in ontwikkeling | `marie` / `broodhuis` |

> De ontwikkellogin werkt alleen zolang `ADMIN_PASSWORD` niet ingesteld is en
> `NODE_ENV` niet op `production` staat. In productie is een eigen wachtwoord
> verplicht; zonder configuratie kan er niemand in de admin.

### Handige commando’s

| Commando | Doet |
| --- | --- |
| `npm run dev` | Start de webshop op poort 4317 (zet eerst de database klaar) |
| `npm run build` / `npm start` | Productiebuild en -server |
| `npm run seed` | Zet het startassortiment (opnieuw) klaar — veilig herhaalbaar |
| `npm run db:migrate` | Nieuwe migratie maken na een schemawijziging |
| `npm run db:reset` | Database leegmaken, migreren en opnieuw seeden |
| `npm run db:studio` | Prisma Studio, om rechtstreeks in de data te kijken |
| `npm test` | Tests op de tijdsloten, deadlines, bestelperiodes en bedragen |
| `npm run smoke` | Doorloopt de hele keten zonder browser: winkelwagen → moment → bestelling → betaling → betaald |
| `npm run lint` / `npm run typecheck` | ESLint en TypeScript |

---

## Omgevingsvariabelen

Kopieer `.env.example` naar `.env` en vul aan wat je nodig hebt. Alles heeft een
werkende standaardwaarde.

| Variabele | Standaard | Waarvoor |
| --- | --- | --- |
| `DATABASE_URL` | — | Postgres-URL. Op Vercel wint `STORAGE_DATABASE_URL` van de Neon-koppeling |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:4317` | Basis voor betaal-redirects en webhook |
| `ADMIN_USER` | `marie` (enkel in dev) | Gebruikersnaam voor `/admin` |
| `ADMIN_PASSWORD` | `broodhuis` (enkel in dev) | Wachtwoord voor `/admin` |
| `ADMIN_SESSION_SECRET` | dev-sleutel | Ondertekent de sessiecookie — `openssl rand -base64 32` |
| `MOLLIE_API_KEY` | leeg → sandbox | Mollie test- of live-sleutel |
| `MOLLIE_METHODS` | `bancontact,creditcard` | Beperkt de aangeboden betaalmethodes |
| `MOLLIE_WEBHOOK_BASE_URL` | — | Publieke tunnel-URL om de webhook lokaal te testen |

---

## Hoe het werkt voor de klant

1. **Assortiment** — producten per categorie, met foto, prijs per eenheid,
   ingrediënten, allergenen en (indien van toepassing) de bestelperiode.
2. **Winkelwagen** — blijft in de browser bewaard, maar wordt altijd door de
   server herrekend. Verdwenen of uitverkochte producten vallen eruit met een
   melding, in plaats van stil verkeerd te rekenen.
3. **Afrekenen** — afhalen (gratis) of leveren (+ € 2,50), daarna een moment
   kiezen, gegevens invullen en meteen betalen.
4. **Bevestiging** — de bestelling ligt pas vast na een gelukte betaling. De
   klant krijgt een bestelnummer (`BH-260915-0001`) en een bestelpagina met alle
   details.

### Momenten, deadlines en bestelperiodes

Alles staat samen in [`src/lib/shop-config.ts`](src/lib/shop-config.ts):

- **Leveren** — alleen donderdagvoormiddag (9:00–12:00),
  vrijdagnamiddag (13:30–17:00) en zondagvoormiddag (9:00–12:00).
- **Afhalen** — woensdag t.e.m. zondag in de voormiddag. Dit zijn
  **placeholders** op basis van een klassiek bakkerijritme: pas ze aan naar de
  echte openingsuren.
- **Leveringskost** — € 2,50, en enkel in postcode 9250. Buurgemeenten voeg je
  toe aan `deliveryPostalCodes`.
- **Besteldeadline** — tot 18u de dag vóór het gekozen moment, zodat de bakker
  ’s avonds weet wat er ’s morgens moet.
- **Bestelperiode per product** — een product met `leadTimeDays: 14` (de
  feesttaart in de seed) laat pas momenten vanaf veertien dagen later kiezen.
  Staan er meerdere producten in de wagen, dan geldt de langste periode.
- **Sluitingsdagen** — die beheert de bakker zelf via
  `/admin/instellingen`, zonder deploy.

Momenten worden altijd in de tijdzone **Europe/Brussels** berekend, ook als de
server in UTC draait.

---

## Beheer (`/admin`)

| Pagina | Wat je er doet |
| --- | --- |
| Overzicht | Wat er te bakken staat, eerstvolgende bestellingen, lage voorraad, testmodus-waarschuwing |
| Bestellingen | Filteren op status, zoeken op naam of bestelnummer, bestelling in detail met alle contactgegevens |
| Producten | Toevoegen, aanpassen, offline halen of verwijderen; voorraad rechtstreeks in de lijst bijwerken |
| Categorieën | Groepen beheren — handig om een seizoenscategorie tijdelijk onzichtbaar te maken |
| Instellingen | Sluitingsdagen, betaalinstellingen en een overzicht van de momenten |

Per product beheert de bakker: naam, categorie, beschrijving, foto,
ingrediënten, de 14 wettelijke allergenen, prijs, eenheid, voorraad (of “altijd
beschikbaar”), bestelperiode in dagen, zichtbaarheid en of het uitgelicht staat
op de homepage.

### Productfoto’s

Uploads komen in `public/uploads/` (max 5 MB, JPG/PNG/WebP/AVIF) en worden niet
in git bewaard. Je kan in hetzelfde veld ook de link naar een externe foto
plakken.

Op een omgeving met een read-only schijf (zoals Vercel) lukt uploaden niet. Twee
opties:

1. **Vercel Blob** — `npm i @vercel/blob`, `BLOB_READ_WRITE_TOKEN` instellen en
   in [`src/app/api/admin/uploads/route.ts`](src/app/api/admin/uploads/route.ts)
   de `writeFile`-tak vervangen door `put(fileName, file, { access: "public" })`.
   De rest van de admin blijft ongewijzigd, want die kent enkel de URL die
   terugkomt.
2. **Externe URL’s plakken** — werkt meteen. Hosts die je met `next/image` wil
   optimaliseren, voeg je toe aan `images.remotePatterns` in
   [`next.config.ts`](next.config.ts); andere hosts worden gewoon als
   `<img>` geladen.

De meegeleverde foto’s in `public/images/` zijn **placeholders**, bedoeld om
vervangen te worden door echte foto’s van de bakkerij.

---

## Betalen

De checkout praat met één smalle interface
([`src/lib/payments/types.ts`](src/lib/payments/types.ts)), niet met een
provider. Vandaag zitten er twee implementaties achter:

- **Sandbox** (standaard, zolang `MOLLIE_API_KEY` leeg is) — dezelfde flow, met
  een lokale pagina waar je zelf kiest of de betaling lukt of mislukt. Ideaal om
  te demonstreren zonder betaalaccount. De webshop toont dan overal een
  duidelijke “testmodus”-melding.
- **Mollie** — Bancontact en bankkaart, in het Nederlands (`nl_BE`).

### Mollie in test nemen

1. Maak een account op <https://www.mollie.com> en zet in het dashboard de
   methodes aan die je wil (minstens **Bancontact**).
2. Neem de **test-API-key** (begint met `test_`) en zet die in `.env`:
   ```env
   MOLLIE_API_KEY="test_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
   MOLLIE_METHODS="bancontact,creditcard"
   ```
3. Herstart `npm run dev`. Je komt nu op de echte Mollie-testpagina terecht,
   waar je zelf de uitkomst (paid, failed, expired…) kiest.
4. **Webhook lokaal:** Mollie kan `localhost` niet bereiken, dus laat de
   webshop de status ophalen wanneer de klant terugkeert — dat gebeurt
   automatisch op de bestelpagina. Wil je de webhook toch echt testen, zet dan
   een tunnel op (`ngrok http 4317`) en vul
   `MOLLIE_WEBHOOK_BASE_URL="https://<jouw-tunnel>"` in.

### Live gaan

1. Zet de live-sleutel (`live_…`) in `MOLLIE_API_KEY` en `NEXT_PUBLIC_SITE_URL`
   op het echte https-domein.
2. Controleer in het Mollie-dashboard dat de webhook-URL bereikbaar is:
   `https://<domein>/api/webhooks/mollie`.
3. **Kaartkosten vermijden:** Bancontact is per transactie goedkoper dan
   Visa/Mastercard. Wil je alleen Bancontact aanbieden, zet dan
   `MOLLIE_METHODS="bancontact"` (of zet de kaartmethodes uit in het
   Mollie-dashboard).

### Later naar Worldline

De bakkerij gebruikt Worldline in de winkel. Overstappen (of Worldline naast
Mollie zetten) vraagt geen wijziging aan de checkout, de bestellingen of de
admin:

1. Maak `src/lib/payments/worldline.ts` met een `PaymentGateway`-implementatie:
   `createPayment` maakt een Hosted Checkout-sessie en geeft de betaal-URL
   terug, `fetchPayment` haalt de status op.
2. Voeg in [`src/lib/payments/index.ts`](src/lib/payments/index.ts) een tak toe
   (bv. op basis van `PAYMENT_PROVIDER=worldline`).
3. Maak een webhookroute naar analogie met
   [`src/app/api/webhooks/mollie/route.ts`](src/app/api/webhooks/mollie/route.ts).

De statussen die de rest van de webshop verwacht (`open`, `pending`, `paid`,
`failed`, `canceled`, `expired`) blijven dezelfde; enkel de mapping is
providerspecifiek.

### Voorraad en betaling

Producten met voorraadbeheer worden **gereserveerd** zodra de bestelling
aangemaakt wordt, en weer vrijgegeven als de betaling mislukt, vervalt of
geannuleerd wordt (ook wanneer de bakker een bestelling annuleert). Klikt de
klant daarna op “Opnieuw betalen”, dan worden de stuks opnieuw gereserveerd —
en als ze inmiddels weg zijn, krijgt de klant dat te zien vóór hij betaalt.

Verwerking van betaalstatussen is idempotent: de webhook van de provider en de
terugkeerpagina van de klant mogen dat allebei en meermaals doen. Twee klanten
die tegelijk het laatste stuk bestellen, kunnen elkaar niet overschrijven: de
voorraadcontrole zit in dezelfde transactie als het aanmaken van de bestelling.

---

## Techniek

| Onderdeel | Keuze |
| --- | --- |
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| Stijl | Tailwind CSS v4 met shadcn/ui, warm crème/broodkorst-palet |
| Data | Prisma 7 met Postgres (Neon) via de `pg`-adapter |
| Betalingen | Mollie (REST) met sandbox-fallback |
| Sessies | Ondertekende cookie (HMAC-SHA256, Web Crypto) |
| Validatie | Zod, zowel voor de checkout als voor de admin |

```
src/
├─ app/
│  ├─ (shop)/              webshop: home, assortiment, product, winkelwagen,
│  │                       afrekenen, bestelling, sandboxbetaling, info
│  ├─ admin/               login + beveiligde beheerschil
│  └─ api/                 Mollie-webhook en foto-upload
├─ components/             UI: winkelwagen, checkout, admin, shadcn-primitieven
├─ lib/
│  ├─ shop-config.ts       momenten, openingsuren, leveringskost, deadlines
│  ├─ slots.ts             tijdsloten, bestelperiodes en deadlines
│  ├─ cart.ts              types (browser + server)
│  ├─ cart-pricing.ts      herprijzing op de server
│  ├─ orders.ts            bestellingen, voorraad en betaalstatussen
│  ├─ payments/            provider-interface, Mollie, sandbox
│  ├─ datetime.ts          tijdzone-helpers voor Europe/Brussels
│  └─ auth/                admin-sessie
└─ server/actions/         server actions per domein
```

Enkele bewuste keuzes:

- **Prijzen in centen (`Int`)** — geen afrondingsverrassingen.
- **De browser bepaalt geen prijzen.** De winkelwagen stuurt enkel product-id’s
  en aantallen; de server rekent alles opnieuw door voor er een bestelling of
  betaling ontstaat.
- **Bestelpagina op een onvoorspelbare sleutel.** Bestelnummers lopen op; via
  een geheime `publicToken` in de URL kan niemand andermans gegevens opvragen.
- **Geen enums, geen scalar lists** in het schema, zodat exact hetzelfde model
  op SQLite én Postgres werkt.
- **De admin controleert de sessie in de pagina’s en in elke server action**,
  niet enkel in de middleware.

### Database

Productie gebruikt de Neon-Postgres die al aan het Vercel-project hangt
(`neon-broodhuis`). De webshop leest `STORAGE_DATABASE_URL` (gezet door die
koppeling) of, als die er niet is, `DATABASE_URL`. Het oude SQLite-bestand
werkt niet op Vercel: de map bestaat daar niet en de schijf bewaart geen
bestellingen.

De live database heeft het assortiment al. `npm run build` voegt hoogstens de
nullable kolom `Category.icon` toe en seedt alleen een lege database. Draai
geen `prisma db push` tegen productie: de database heeft extra tabellen
(varianten, medewerkers) die dit schema niet beschrijft.

---

## Wat er nog niet in zit

Bewust buiten deze eerste versie gehouden:

- **Bestelbevestiging per e-mail.** De klant krijgt nu een bestelpagina met alle
  details. Een e-mail toevoegen kan in
  [`src/lib/orders.ts`](src/lib/orders.ts) waar een betaling op `paid` gezet
  wordt (bv. met Resend of Postmark). Zet daarvoor eerst een afzenderdomein op.
- **Echte Worldline-koppeling** — de adapter staat klaar, zie hierboven.
- **Koppeling met kassa of voorraadbeheer.** Voorraad wordt hier los bijgehouden.
- **Ritplanning voor de leveringen** en een leverancierportaal.
- **Meerdere medewerkers met eigen login.** Nu is er één admin-login; wil je
  aparte accounts, dan vervang je `src/lib/auth/` door NextAuth (credentials).

### Placeholders die nagekeken moeten worden

- Openingsuren en leveringsmomenten in `src/lib/shop-config.ts`.
- Prijzen en beschrijvingen van de 13 seedproducten.
- De productfoto’s in `public/images/`.
- Het e-mailadres van de bakkerij (`SHOP.email` staat leeg en wordt daarom niet
  getoond).
