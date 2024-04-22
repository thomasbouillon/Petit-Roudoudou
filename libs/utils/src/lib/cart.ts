import { Cart } from '@prisma/client';

export function cartContainsCustomizedItems(cart: Cart): boolean {
  return cart.items.some((item) => item.type === 'customized');
}
