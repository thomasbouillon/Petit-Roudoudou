import { CartItemWithTotal, CartWithTotal, Taxes } from '@couture-next/types';
import { applyTaxes, getTaxes } from '@couture-next/utils';
import { Cart } from '@prisma/client';
import { Context } from './context';

export async function computeCartWithTotal(ctx: Context, cart: Cart): Promise<CartWithTotal> {
  const articleIds = new Set(cart.items.filter((item) => item.type !== 'giftCard').map((item) => item.articleId));
  const articles =
    articleIds.size > 0 ? await ctx.orm.article.findMany({ where: { id: { in: [...articleIds] } } }) : [];

  let cartTotalTaxExcluded = 0;
  let cartTaxes = {} as Record<Taxes, number>;
  let cartTotalWeight = 0;

  const populatedItems = cart.items
    .map((item) => {
      if (item.type === 'giftCard') {
        return {
          ...item,
          totalTaxExcluded: item.amount,
          totalTaxIncluded: item.amount,
          perUnitTaxExcluded: item.amount,
          perUnitTaxIncluded: item.amount,
          totalWeight: 0,
          taxes: {
            [Taxes.VAT_20]: 0,
          },
        };
      }

      const article = articles.find((article) => article.id === item.articleId);
      if (!article) {
        // Article was removed
        return null;
      }

      const sku = article.skus.find((sku) => sku.uid === item.skuId);

      if (!sku) {
        // SKU was removed
        return null;
      }

      if (item.type === 'inStock') {
        const stock = article.stocks.find((stock) => stock.uid === item.stockUid);
        if (!stock) {
          // Stock was removed
          return null;
        }

        if (stock.stock === 0) {
          // Stock is out of stock
          return null;
        } else if (stock.stock < item.quantity) {
          item.quantity = stock.stock;
        }
      }

      if (item.type === 'customized' && (article.minQuantity ?? 1) > item.quantity) {
        // Quantity too low
        item.quantity = article.minQuantity ?? 1;
      }

      const perUnitTaxExcluded = Math.round(sku.price * 100) / 100;
      const perUnitTaxIncluded = applyTaxes(perUnitTaxExcluded);
      const totalTaxExcluded = Math.round(perUnitTaxExcluded * item.quantity * 100) / 100;
      const totalTaxIncluded = Math.round(perUnitTaxIncluded * item.quantity * 100) / 100;
      const totalWeight = Math.round(sku.weight * item.quantity * 100) / 100;

      const vat = getTaxes(totalTaxExcluded);
      cartTotalTaxExcluded += totalTaxExcluded;
      cartTotalWeight += totalWeight;
      cartTaxes[Taxes.VAT_20] = (cartTaxes[Taxes.VAT_20] || 0) + vat;

      return {
        ...item,
        totalTaxExcluded,
        totalTaxIncluded,
        perUnitTaxExcluded,
        perUnitTaxIncluded,
        totalWeight,
        taxes: {
          [Taxes.VAT_20]: vat,
        },
      } satisfies CartItemWithTotal;
    })
    .filter((item) => item !== null);

  // Round taxes
  cartTaxes = Object.entries(cartTaxes).reduce((acc, [tax, value]) => {
    acc[tax as unknown as Taxes] = Math.round(value * 100) / 100;
    return acc;
  }, {} as Record<Taxes, number>);

  return {
    ...cart,
    items: populatedItems,
    totalTaxExcluded: Math.round(cartTotalTaxExcluded * 100) / 100,
    totalTaxIncluded:
      Math.round((cartTotalTaxExcluded + Object.values(cartTaxes).reduce((acc, tax) => acc + tax, 0)) * 100) / 100,
    taxes: cartTaxes,
    totalWeight: Math.round(cartTotalWeight),
  };
}
