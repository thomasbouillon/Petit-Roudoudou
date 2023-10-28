import { NewCartItem } from '../cart';

export type CallAddToCartMutationPayload = NewCartItem;
export type CallAddToCartMutationResponse = void;

export type CallGetCartPaymentUrlPayload = never | undefined;
export type CallGetCartPaymentUrlResponse = string;
