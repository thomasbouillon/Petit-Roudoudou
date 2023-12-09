import { NewCustomizedCartItem, NewInStockCartItem } from '../cart';
import { Order } from '../order';
import { BoxtalCarriers, PickupPoint } from '@couture-next/shipping';

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
}