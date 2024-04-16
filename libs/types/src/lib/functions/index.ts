import { NewCustomizedCartItem, NewGiftCardCartItem, NewInStockCartItem } from '../cart';
import { Extras, Order } from '../order';
import { BoxtalCarriers, PickupPoint } from '@couture-next/shipping';

// Add to cart
export type CallEditCartMutationPayload =
  | (NewCustomizedCartItem & { type: 'add-customized-item'; quantity: number })
  | (NewInStockCartItem & { type: 'add-in-stock-item' })
  | (NewGiftCardCartItem & { type: 'add-gift-card-item' })
  | { type: 'change-item-quantity'; index: number; newQuantity: number };

export type CallEditCartMutationResponse = void;

// Get cart payment url
export type CallGetCartPaymentUrlPayload = {
  billing: Omit<Order['billing'], 'checkoutSessionId' | 'giftCards' | 'amountPaidWithGiftCards'>;
  shipping: Omit<Order['shipping'], 'price'>;
  giftCards: Array<string>;
  extras: Extras;
  promotionCode?: string;
};
export type CallGetCartPaymentUrlResponse = string;

// Pay by bank transfer
export type CallPayByBankTransferPayload = {
  billing: Omit<Order['billing'], 'checkoutSessionId' | 'giftCards' | 'amountPaidWithGiftCards'>;
  shipping: Omit<Order['shipping'], 'price'>;
  giftCards: Array<string>;
  extras: Extras;
  promotionCode?: string;
};
export type CallPayByBankTransferResponse = string;

// Pay by gift card
export type CallPayByGiftCardPayload = {
  billing: Omit<Order['billing'], 'checkoutSessionId' | 'giftCards' | 'amountPaidWithGiftCards'>;
  shipping: Omit<Order['shipping'], 'price'>;
  giftCards: Array<string>;
  extras: Extras;
  promotionCode?: string;
};
export type CallPayByGiftCardResponse = string;

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
