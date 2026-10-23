/**
 * Een "paid" van een echte provider telt alleen als munt en bedrag gelijk zijn
 * aan wat we bij het aanmaken hebben opgeslagen. De sandbox heeft geen
 * providerbedrag; die blijft de testflow.
 */
export function mayApplyPaidStatus(input: {
  provider: string;
  storedAmountCents: number;
  status: string;
  amountCents?: number;
  currency?: string | null;
}): boolean {
  if (input.status !== "paid") return true;
  if (input.provider === "sandbox") return true;
  if (input.currency !== "EUR") return false;
  if (typeof input.amountCents !== "number" || !Number.isInteger(input.amountCents)) {
    return false;
  }
  return input.amountCents === input.storedAmountCents;
}
