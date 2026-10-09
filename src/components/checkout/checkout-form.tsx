"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangleIcon,
  CalendarClockIcon,
  CheckIcon,
  ChevronDownIcon,
  CreditCardIcon,
  Loader2Icon,
  LockIcon,
  ShoppingBasketIcon,
  StoreIcon,
  TruckIcon,
} from "lucide-react";

import { useCart } from "@/components/cart/cart-provider";
import { useCheckoutDraft } from "@/components/checkout/checkout-draft";
import { ProductImage } from "@/components/product-image";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  capitalizeFirst,
  formatIsoDateLong,
  groupByMonth,
} from "@/lib/datetime";
import { cartLineKey } from "@/lib/cart";
import type { CheckoutData, SlotOption } from "@/lib/checkout-types";
import { EMPTY_CHECKOUT_STATE } from "@/lib/form-state";
import { formatEuro } from "@/lib/money";
import { formatQuantityLabel, isWeightPortionUnit } from "@/lib/weight";
import type { FulfillmentType } from "@/lib/shop-config";
import { cn } from "@/lib/utils";
import { getCheckoutData, placeOrder } from "@/server/actions/checkout";

const VISIBLE_SLOTS = 6;

export function CheckoutForm({ shopCity }: { shopCity: string }) {
  const { items, isReady } = useCart();
  const [data, setData] = useState<CheckoutData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAllSlots, setShowAllSlots] = useState(false);
  const [state, formAction, isPending] = useActionState(
    placeOrder,
    EMPTY_CHECKOUT_STATE,
  );
  const loadedSignatureRef = useRef<string>("");
  const addressSeededRef = useRef(false);
  const errorRef = useRef<HTMLDivElement>(null);

  const { draft, setField } = useCheckoutDraft();
  const fulfillment: FulfillmentType = draft.fulfillmentType;
  const slot = draft.slot;

  function chooseFulfillment(next: FulfillmentType) {
    setField("fulfillmentType", next);
    setShowAllSlots(false);
  }

  const signature = useMemo(
    () =>
      items
        .map((line) => `${cartLineKey(line)}:${line.quantity}`)
        .sort()
        .join("|"),
    [items],
  );

  useEffect(() => {
    if (!isReady) return;
    if (signature === loadedSignatureRef.current) return;
    loadedSignatureRef.current = signature;

    let cancelled = false;
    setIsLoading(true);

    getCheckoutData(
      items.map((line) => ({
        productId: line.productId,
        variantId: line.variantId,
        quantity: line.quantity,
        selection: line.selection,
      })),
    )
      .then((result) => {
        if (cancelled) return;
        setData(result);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // items veranderen samen met signature; we halen enkel opnieuw op als de
    // inhoud van de winkelwagen echt wijzigt.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, isReady]);

  const slotOptions = useMemo<SlotOption[]>(
    () => data?.slots[fulfillment] ?? [],
    [data, fulfillment],
  );

  // Eerste moment voorstellen, zodat de klant minder moet tikken.
  useEffect(() => {
    if (slotOptions.length === 0) {
      if (slot !== "") setField("slot", "");
      return;
    }
    if (!slotOptions.some((option) => option.value === slot)) {
      setField("slot", slotOptions[0].value);
    }
  }, [slotOptions, slot, setField]);

  // Postcode en gemeente één keer voorvullen: de meeste klanten wonen hier.
  useEffect(() => {
    if (!data || addressSeededRef.current) return;
    addressSeededRef.current = true;
    if (draft.postalCode === "") {
      setField("postalCode", data.deliveryPostalCodes[0] ?? "");
    }
    if (draft.city === "") setField("city", shopCity);
  }, [data, draft.postalCode, draft.city, setField, shopCity]);

  // Bij een fout naar de melding scrollen; op gsm staat die anders buiten beeld.
  useEffect(() => {
    if (state.formError) {
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [state.formError]);

  if (!isReady || (isLoading && !data)) {
    return (
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    );
  }

  if (!data || data.cart.lines.length === 0) {
    return (
      <div className="mt-10 text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-secondary">
          <ShoppingBasketIcon className="size-7 text-crust" />
        </div>
        <h2 className="mt-4 font-heading text-xl font-semibold">
          Er staat niets om af te rekenen
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Leg eerst iets in je winkelwagen. Daarna kies je hier je moment en betaal
          je online.
        </p>
        <ButtonLink
          href="/assortiment"
          className="mt-5 h-12 rounded-none px-6 text-base"
        >
          Naar het assortiment
        </ButtonLink>
      </div>
    );
  }

  const { cart } = data;
  const deliveryFeeCents = fulfillment === "delivery" ? data.deliveryFeeCents : 0;
  const totalCents = cart.subtotalCents + deliveryFeeCents;
  const visibleSlots = showAllSlots
    ? slotOptions
    : slotOptions.slice(0, VISIBLE_SLOTS);
  const errors = state.errors;

  return (
    // noValidate: anders blokkeert de browser het versturen met een Engelse
    // tooltip en zien we onze eigen Nederlandse meldingen nooit.
    <form action={formAction} noValidate className="mt-8">
      <input
        type="hidden"
        name="items"
        value={JSON.stringify(
          cart.lines.map((line) => ({
            productId: line.productId,
            variantId: line.variantId,
            quantity: line.quantity,
            selection: line.selection,
          })),
        )}
      />
      <input type="hidden" name="slot" value={slot} />

      <div className="grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-start">
        <div className="space-y-6">
          <div ref={errorRef}>
            {state.formError && (
              <Alert variant="destructive">
                <AlertTriangleIcon />
                <AlertTitle>Even nakijken</AlertTitle>
                <AlertDescription>{state.formError}</AlertDescription>
              </Alert>
            )}
          </div>

          {data.payment.isSandbox && (
            <Alert className="border-warning/50 bg-warning/15">
              <AlertTriangleIcon />
              <AlertTitle>Testmodus</AlertTitle>
              <AlertDescription>
                Er is nog geen Mollie-sleutel ingesteld. Je doorloopt de echte flow,
                maar er wordt geen geld afgehouden.
              </AlertDescription>
            </Alert>
          )}

          <section>
            <h2
              id="stap-bezorgwijze"
              className="font-heading text-lg font-semibold"
            >
              1. Afhalen of leveren?
            </h2>
            <div
              role="radiogroup"
              aria-labelledby="stap-bezorgwijze"
              className="mt-4 grid gap-3 sm:grid-cols-2"
            >
              <FulfillmentOption
                icon={StoreIcon}
                title="Afhalen"
                price="Gratis"
                description={`In de winkel in ${shopCity}, woensdag t.e.m. zondag`}
                value="pickup"
                checked={fulfillment === "pickup"}
                onSelect={() => chooseFulfillment("pickup")}
              />
              <FulfillmentOption
                icon={TruckIcon}
                title="Leveren"
                price={`+ ${formatEuro(data.deliveryFeeCents)}`}
                description="Donderdagvoormiddag, vrijdagnamiddag of zondagvoormiddag"
                value="delivery"
                checked={fulfillment === "delivery"}
                onSelect={() => chooseFulfillment("delivery")}
              />
            </div>
            {fulfillment === "delivery" && (
              <p className="mt-3 text-xs text-muted-foreground">
                We leveren in postcode {data.deliveryPostalCodes.join(", ")}.
              </p>
            )}
          </section>

          <section className="border-t border-border/50 pt-6">
            <h2 id="stap-moment" className="font-heading text-lg font-semibold">
              2. Wanneer past het?
            </h2>

            {cart.maxLeadTimeDays > 0 && (
              <div className="mt-3 flex min-w-0 gap-3 text-sm">
                <CalendarClockIcon className="mt-0.5 size-4 shrink-0 text-accent-foreground" />
                <p>
                  <span className="font-medium">{cart.leadTimeProductName}</span>{" "}
                  moet {cart.maxLeadTimeDays} dagen vooraf besteld worden.{" "}
                  {data.earliestDate
                    ? `Het vroegste moment is daarom ${formatIsoDateLong(data.earliestDate)}.`
                    : "Daarom zie je hieronder pas latere momenten."}
                </p>
              </div>
            )}

            {slotOptions.length === 0 ? (
              <Alert className="mt-4">
                <AlertTriangleIcon />
                <AlertTitle>Geen momenten beschikbaar</AlertTitle>
                <AlertDescription>
                  {fulfillment === "delivery"
                    ? "Er zijn voorlopig geen leveringsmomenten vrij. Kies afhalen of bel ons even."
                    : "Er zijn voorlopig geen afhaalmomenten vrij. Bel ons even, we zoeken een oplossing."}
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <div
                  role="radiogroup"
                  aria-labelledby="stap-moment"
                  className="mt-4 space-y-4"
                >
                  {groupByMonth(visibleSlots).map((month) => (
                    <div key={month.monthKey} className="space-y-2">
                      <p className="eyebrow">
                        {capitalizeFirst(month.monthLabel)}
                      </p>
                      {month.items.map((option) => (
                        <SlotRow
                          key={option.value}
                          option={option}
                          checked={slot === option.value}
                          onSelect={() => setField("slot", option.value)}
                        />
                      ))}
                    </div>
                  ))}
                </div>

                {slotOptions.length > VISIBLE_SLOTS && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="mt-3 w-full rounded-none"
                    onClick={() => setShowAllSlots((current) => !current)}
                  >
                    {showAllSlots
                      ? "Minder momenten tonen"
                      : `Nog ${slotOptions.length - VISIBLE_SLOTS} momenten tonen`}
                    <ChevronDownIcon
                      className={cn(
                        "size-4 transition-transform",
                        showAllSlots && "rotate-180",
                      )}
                    />
                  </Button>
                )}
              </>
            )}

            {errors.slot && (
              <p className="mt-3 text-sm text-destructive">{errors.slot}</p>
            )}
          </section>

          <section className="border-t border-border/50 pt-6">
            <h2 className="font-heading text-lg font-semibold">3. Jouw gegevens</h2>
            <div className="mt-4 grid gap-4">
              <Field
                name="customerName"
                value={draft.customerName}
                onChange={(event) => setField("customerName", event.target.value)}
                label="Naam"
                autoComplete="name"
                error={errors.customerName}
                required
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  name="customerEmail"
                  value={draft.customerEmail}
                  onChange={(event) =>
                    setField("customerEmail", event.target.value)
                  }
                  label="E-mail"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  hint="Zo vinden we je bestelling terug."
                  error={errors.customerEmail}
                  required
                />
                <Field
                  name="customerPhone"
                  value={draft.customerPhone}
                  onChange={(event) =>
                    setField("customerPhone", event.target.value)
                  }
                  label="Telefoon"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  hint="Zodat we je kunnen bereiken bij vragen."
                  error={errors.customerPhone}
                  required
                />
              </div>

              {fulfillment === "delivery" && (
                <div className="grid gap-4">
                  <p className="text-sm font-medium">Leveringsadres</p>
                  <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
                    <Field
                      name="street"
                      value={draft.street}
                      onChange={(event) => setField("street", event.target.value)}
                      label="Straat"
                      autoComplete="address-line1"
                      error={errors.street}
                      required
                    />
                    <Field
                      name="houseNumber"
                      value={draft.houseNumber}
                      onChange={(event) =>
                        setField("houseNumber", event.target.value)
                      }
                      label="Nummer"
                      autoComplete="address-line2"
                      error={errors.houseNumber}
                      required
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-[8rem_1fr]">
                    <Field
                      name="postalCode"
                      value={draft.postalCode}
                      onChange={(event) =>
                        setField("postalCode", event.target.value)
                      }
                      label="Postcode"
                      inputMode="numeric"
                      autoComplete="postal-code"
                      error={errors.postalCode}
                      required
                    />
                    <Field
                      name="city"
                      value={draft.city}
                      onChange={(event) => setField("city", event.target.value)}
                      label="Gemeente"
                      autoComplete="address-level2"
                      error={errors.city}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="deliveryNote">
                      Bezorginstructies{" "}
                      <span className="font-normal text-muted-foreground">
                        (optioneel)
                      </span>
                    </Label>
                    <Input
                      id="deliveryNote"
                      name="deliveryNote"
                      value={draft.deliveryNote}
                      onChange={(event) =>
                        setField("deliveryNote", event.target.value)
                      }
                      placeholder="Bv. bel aan bij de zijdeur"
                    />
                  </div>
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="note">
                  Opmerking bij je bestelling{" "}
                  <span className="font-normal text-muted-foreground">
                    (optioneel)
                  </span>
                </Label>
                <Textarea
                  id="note"
                  name="note"
                  rows={3}
                  value={draft.note}
                  onChange={(event) => setField("note", event.target.value)}
                  placeholder="Bv. brood gesneden, of het opschrift voor je taart"
                />
                {errors.note && (
                  <p className="text-sm text-destructive">{errors.note}</p>
                )}
              </div>
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-32">
          <div className="space-y-4 border-t border-border/50 pt-5">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold">Je bestelling</h2>
              <Link
                href="/winkelwagen"
                className="text-sm text-muted-foreground underline hover:text-foreground"
              >
                Wijzigen
              </Link>
            </div>

            <ul className="space-y-3">
              {cart.lines.map((line) => (
                <li key={cartLineKey(line)} className="flex items-center gap-3">
                  <span className="relative size-12 shrink-0 overflow-hidden">
                    <ProductImage
                      src={line.imageUrl}
                      alt={line.name}
                      sizes="48px"
                    />
                  </span>
                  <span className="min-w-0 flex-1 text-sm">
                    <span className="block truncate font-medium">{line.name}</span>
                    <span className="text-muted-foreground">
                      {isWeightPortionUnit(line.unit)
                        ? `${formatQuantityLabel(line.quantity, line.unit)} · ${formatEuro(line.unitPriceCents)} ${line.unit}`
                        : `${formatQuantityLabel(line.quantity, line.unit)} × ${formatEuro(line.unitPriceCents)}`}
                    </span>
                    {line.photoUrl ? (
                      <a
                        href={line.photoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 block text-xs underline"
                      >
                        Foto voor de taart
                      </a>
                    ) : null}
                  </span>
                  <span className="shrink-0 text-sm font-medium tabular-nums">
                    {formatEuro(line.lineTotalCents)}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="space-y-2 border-t border-border pt-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Subtotaal</dt>
                <dd className="tabular-nums">{formatEuro(cart.subtotalCents)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">
                  {fulfillment === "delivery" ? "Levering" : "Afhalen"}
                </dt>
                <dd className="tabular-nums">
                  {deliveryFeeCents === 0 ? "Gratis" : formatEuro(deliveryFeeCents)}
                </dd>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-2 font-heading text-lg font-semibold">
                <dt>Totaal</dt>
                <dd className="tabular-nums">{formatEuro(totalCents)}</dd>
              </div>
            </dl>

            <label className="flex min-h-12 cursor-pointer items-start gap-3 py-2 text-sm">
              <input
                type="checkbox"
                name="acceptTerms"
                checked={draft.acceptTerms}
                onChange={(event) => setField("acceptTerms", event.target.checked)}
                className="mt-0.5 size-5 shrink-0 rounded border-input accent-primary"
              />
              <span>
                Ik aanvaard de{" "}
                <Link href="/voorwaarden" className="underline hover:text-foreground">
                  bestel- en betaalvoorwaarden
                </Link>{" "}
                en de{" "}
                <Link href="/privacy" className="underline hover:text-foreground">
                  privacyverklaring
                </Link>
                . Ik weet dat ik nu online betaal en dat mijn bestelling pas
                vastligt na een gelukte betaling.
              </span>
            </label>
            {errors.acceptTerms && (
              <p className="text-sm text-destructive">{errors.acceptTerms}</p>
            )}

            <Button
              type="submit"
              size="lg"
              disabled={isPending || slotOptions.length === 0}
              className="hidden h-12 w-full rounded-none text-base lg:flex"
            >
              {isPending ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" /> Bezig met
                  doorsturen…
                </>
              ) : (
                <>
                  <CreditCardIcon className="size-4" /> Betaal{" "}
                  {formatEuro(totalCents)}
                </>
              )}
            </Button>

            <p className="hidden items-center justify-center gap-1.5 text-xs text-muted-foreground lg:flex">
              <LockIcon className="size-3" />
              Betalen via {data.payment.isSandbox ? "testmodus" : "Mollie"} —
              Bancontact of KBC/CBC
            </p>
          </div>
        </aside>
      </div>

      {/* Vaste betaalbalk op gsm: totaal en knop altijd binnen duimbereik */}
      <div className="print-hidden fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-muted-foreground">
              {fulfillment === "delivery" ? "Leveren" : "Afhalen"} ·{" "}
              {slotOptions.find((option) => option.value === slot)
                ?.dateLabelShort ?? "kies een moment"}
            </p>
            <p className="font-heading text-lg leading-tight font-semibold tabular-nums">
              {formatEuro(totalCents)}
            </p>
          </div>
          <Button
            type="submit"
            disabled={isPending || slotOptions.length === 0}
            className="h-12 shrink-0 rounded-none px-5 text-base"
          >
            {isPending ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <CreditCardIcon className="size-4" />
            )}
            Betalen
          </Button>
        </div>
      </div>
    </form>
  );
}

function FulfillmentOption({
  icon: Icon,
  title,
  price,
  description,
  value,
  checked,
  onSelect,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  price: string;
  description: string;
  value: FulfillmentType;
  checked: boolean;
  onSelect: () => void;
}) {
  return (
    <label
      className={cn(
        "flex min-h-12 cursor-pointer items-center gap-3 py-3 transition-colors",
        checked ? "text-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <input
        type="radio"
        name="fulfillmentType"
        value={value}
        checked={checked}
        onChange={onSelect}
        className="sr-only"
      />
      <span
        className={cn(
          "flex size-12 shrink-0 items-center justify-center",
          checked ? "text-foreground" : "text-muted-foreground",
        )}
      >
        <Icon className="size-5" />
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-2">
          <span className="font-heading text-base font-semibold">{title}</span>
          <span className="text-sm text-muted-foreground">{price}</span>
        </span>
        <span className="mt-0.5 block text-xs text-muted-foreground">
          {description}
        </span>
      </span>
    </label>
  );
}

function SlotRow({
  option,
  checked,
  onSelect,
}: {
  option: SlotOption;
  checked: boolean;
  onSelect: () => void;
}) {
  return (
    <label
      className={cn(
        "flex min-h-14 cursor-pointer items-center gap-3 px-1 py-3 transition-colors",
        checked ? "text-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <input
        type="radio"
        name="slotChoice"
        value={option.value}
        checked={checked}
        onChange={onSelect}
        className="sr-only"
      />
      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full border-2",
          checked ? "border-primary bg-primary" : "border-input",
        )}
      >
        {checked && <CheckIcon className="size-3 text-primary-foreground" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium">
          {capitalizeFirst(option.dateLabel)}
        </span>
        <span className="text-sm text-muted-foreground">{option.timeLabel}</span>
      </span>
    </label>
  );
}

function Field({
  name,
  label,
  hint,
  error,
  required,
  type = "text",
  ...inputProps
}: {
  name: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  type?: string;
} & React.ComponentProps<typeof Input>) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      <Input
        id={name}
        name={name}
        type={type}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          error ? `${name}-error` : hint ? `${name}-hint` : undefined
        }
        className="h-12"
        {...inputProps}
      />
      {error ? (
        <p id={`${name}-error`} className="text-sm text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={`${name}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
