import { Cart } from '@prisma/client';
import { Taxes } from './taxes';

export type CartItem = Cart['items'][number];

export type CartItemGiftCard = CartItem & { type: 'giftCard' };
export type CartItemCustomized = CartItem & { type: 'customized' };
export type CartItemInStock = CartItem & { type: 'inStock' };

export type CartWithTotal = Omit<Cart, 'items'> & {
  items: CartItemWithTotal[];
  totalTaxExcluded: number;
  totalTaxIncluded: number;
  taxes: { [key in Taxes]?: number };
  totalWeight: number;
};

type ItemWithTotal<T extends CartItem> = T & {
  totalTaxExcluded: number;
  totalTaxIncluded: number;
  perUnitTaxExcluded: number;
  perUnitTaxIncluded: number;
  totalWeight: number;
  taxes: { [key in Taxes]: number };
};

export type CartItemWithTotal = ItemWithTotal<CartItem>;
export type CartItemGiftCardWithTotal = ItemWithTotal<CartItemGiftCard>;
export type CartItemCustomizedWithTotal = ItemWithTotal<CartItemCustomized>;
export type CartItemInStockWithTotal = ItemWithTotal<CartItemInStock>;
