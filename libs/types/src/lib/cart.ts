import { Cart } from '@prisma/client';

export type CartItem = Cart['items'][number];

export type CartItemGiftCard = CartItem & { type: 'giftCard' };
export type CartItemCustomized = CartItem & { type: 'customized' };
export type CartItemInStock = CartItem & { type: 'inStock' };
