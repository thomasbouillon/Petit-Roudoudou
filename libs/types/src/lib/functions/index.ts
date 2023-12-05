import { NewCustomizedCartItem, NewInStockCartItem } from '../cart';
import { Order } from '../order';

// Add to cart
export type CallAddToCartMutationPayload =
  | (NewCustomizedCartItem & { type: 'add-customized-item' })
  | (NewInStockCartItem & { type: 'add-in-stock-item' });

export type CallAddToCartMutationResponse = void;

// Get cart payment url
export type CallGetCartPaymentUrlPayload = {
  billing: Omit<Order['billing'], 'checkoutSessionId'>;
  shipping: Order['shipping'];
};
export type CallGetCartPaymentUrlResponse = string;

// Pay by bank transfer
export type CallPayByBankTransferPayload = {
  billing: Omit<Order['billing'], 'checkoutSessionId'>;
  shipping: Order['shipping'];
};
export type CallPayByBankTransferResponse = string;