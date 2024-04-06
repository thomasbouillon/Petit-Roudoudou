import { Cart } from '@couture-next/types';

export function cartContainsCustomizedItems(cart: Cart): boolean {
  return cart.items.some((item) => item.type === 'customized');
}
