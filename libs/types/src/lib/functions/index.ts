import { NewCartItem } from '../cart';
import { Order } from '../order';

export type CallAddToCartMutationPayload = NewCartItem;
export type CallAddToCartMutationResponse = void;

export type CallGetCartPaymentUrlPayload = {
  billing: Omit<Order['billing'], 'checkoutSessionId'>;
  shipping: Order['shipping'];
};
export type CallGetCartPaymentUrlResponse = string;
