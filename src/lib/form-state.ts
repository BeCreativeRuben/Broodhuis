/**
 * Vorm van de terugkoppeling die server actions aan formulieren geven.
 * Staat bewust in een gewone module: een "use server"-bestand mag enkel
 * async functies exporteren, geen objecten.
 */

export type FieldErrors = Record<string, string>;

export type FormState = {
  errors: FieldErrors;
  formError: string | null;
  ok: boolean;
};

export const EMPTY_FORM_STATE: FormState = {
  errors: {},
  formError: null,
  ok: false,
};

export type CheckoutState = {
  errors: FieldErrors;
  formError: string | null;
};

export const EMPTY_CHECKOUT_STATE: CheckoutState = {
  errors: {},
  formError: null,
};

export type LoginState = { error: string | null };

export const EMPTY_LOGIN_STATE: LoginState = { error: null };
