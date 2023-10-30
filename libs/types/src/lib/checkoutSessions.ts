type Base = {
  paymentId: string;
  sessionId: string;
  checkoutUrl: string;
};

export type DraftCheckoutSession = {
  type: 'draft';
} & Base;

export type PaidCheckoutSession = {
  type: 'paid';
} & Base;

export type ErrorCheckoutSession = {
  type: 'error';
} & Base;

export type CheckoutSession =
  | DraftCheckoutSession
  | PaidCheckoutSession
  | ErrorCheckoutSession;
