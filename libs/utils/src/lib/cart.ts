import { Cart } from '@couture-next/types';

export function cartContainsCustomizedItems(cart: Cart): boolean {
  return cart.items.some((item) => item.type === 'customized');
}

export function cartTotalTaxIncludedWithOutGiftCards(cart: Cart | null): number {
  if (!cart) return 0;
  return (
    cart.totalTaxIncluded -
    cart.items.filter((item) => item.type === 'giftCard').reduce((total, item) => total + item.totalTaxIncluded, 0)
  );
}
