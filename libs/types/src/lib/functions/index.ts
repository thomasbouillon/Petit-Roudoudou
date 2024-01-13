import { Review } from '../articles';
import { NewCustomizedCartItem, NewInStockCartItem } from '../cart';
import { Extras, Order } from '../order';
import { BoxtalCarriers, PickupPoint } from '@couture-next/shipping';

// Add to cart
export type CallAddToCartMutationPayload =
  | (NewCustomizedCartItem & { type: 'add-customized-item' })
  | (NewInStockCartItem & { type: 'add-in-stock-item' });

export type CallAddToCartMutationResponse = void;

// Get cart payment url
export type CallGetCartPaymentUrlPayload = {
  billing: Omit<Order['billing'], 'checkoutSessionId'>;
  shipping: Omit<Order['shipping'], 'price'>;
  extras: Extras;
  promotionCode?: string;
};
export type CallGetCartPaymentUrlResponse = string;

// Pay by bank transfer
export type CallPayByBankTransferPayload = {
  billing: Omit<Order['billing'], 'checkoutSessionId'>;
  shipping: Omit<Order['shipping'], 'price'>;
  extras: Extras;
  promotionCode?: string;
};
export type CallPayByBankTransferResponse = string;

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

// Promotion code
export type CallGetPromotionCodeDiscountPayload = {
  code: string;
  shippingCost: number;
  extras: Extras;
};

export type CallGetPromotionCodeDiscountResponse = {
  amount: number;
};

// Contact

export type CallSendContactEmailPayload = {
  email: string;
  subject: string;
  message: string;
  recaptchaToken: string;
};

export type CallSendContactEmailResponse = void;

export type CallAddReviewPayload = Pick<Review, 'score' | 'text' | 'articleId'> & { orderId: string };

export type CallAddReviewResponse = void;

export type CallSubscribeToNewsletterPayload = {
  name: string;
  email: string;
  category: string;
  privacy: true;
};

export type CallSubscribeToNewsletterResponse = void;

export type CallBuyShippingForOrderPayload = {
  orderId: string;
};

export type CallBuyShippingForOrderResponse = void;
