import { BoxtalCarriers, PickupPoint } from '@couture-next/shipping';

// Shipping
export type CallListPickUpPointsPayload = {
  zipCode: string;
};
export type CallListPickUpPointsResponse = PickupPoint[];

export type CallGetShippingPricesPayload = {
  weight: number;
};
export type CallGetShippingPricesResponse = {
  [K in BoxtalCarriers]: number;
};

// Contact

export type CallSendContactEmailPayload = {
  email: string;
  subject: string;
  message: string;
  recaptchaToken: string;
};

export type CallSendContactEmailResponse = void;

export type CallSubscribeToNewsletterPayload = {
  name: string;
  email: string;
  category: string;
  privacy: true;
};

export type CallSubscribeToNewsletterResponse = void;
