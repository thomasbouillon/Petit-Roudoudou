import { NewCustomizedCartItem, NewInStockCartItem } from '../cart';
import { Order } from '../order';

export type CallAddToCartMutationPayload =
  | (NewCustomizedCartItem & { type: 'add-customized-item' })
  | (NewInStockCartItem & { type: 'add-in-stock-item' });

export type CallAddToCartMutationResponse = void;

export type CallGetCartPaymentUrlPayload = {
  billing: Omit<Order['billing'], 'checkoutSessionId'>;
  shipping: Order['shipping'];
};
export type CallGetCartPaymentUrlResponse = string;
