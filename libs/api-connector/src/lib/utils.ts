import { CartItemWithTotal, CartWithTotal, Taxes } from '@couture-next/types';
import { applyTaxes, getArticleStockPriceTaxIncluded, getTaxes } from '@couture-next/utils';
import { Cart } from '@prisma/client';
import { Context } from './context';

export async function computeCartWithTotal(ctx: Context, cart: Cart): Promise<CartWithTotal> {
  const articleIds = new Set(
    cart.items
      .filter(
        (item): item is CartItemWithTotal & { type: Exclude<CartItemWithTotal['type'], 'giftCard'> } =>
          item.type !== 'giftCard'
      )
      .map((item) => item.articleId)
  );
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

      if (item.type === 'customized' && !article.enabled) {
        // Article is disabled
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

      let optionsCost = 0;
      for (const option of article.customizables) {
        const choice = item.customizations[option.uid];
        if (!choice) continue;

        if (choice.value && option.price) {
          optionsCost += option.price;
        }
      }
      const price =
        item.type === 'inStock'
          ? getArticleStockPriceTaxIncluded(article.skus, article.stocks.find((stock) => stock.uid === item.stockUid)!)
          : sku.price;
      const perUnitTaxExcluded = Math.round((price + optionsCost) * 100) / 100;
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
    .filter((item): item is CartItemWithTotal => item !== null);

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

export async function deleteImageWithResizedVariants(ctx: Context, path: string) {
  const size = [64, 128, 256, 512, 1024];
  const resizedExtensions = ['webp', 'png'];

  const splitted = path.split('.');
  const originalExt = splitted.pop();
  path = splitted.join('.');

  const deletePromises = resizedExtensions.flatMap((ext) =>
    size.map((width) => deleteImage(ctx, `${path}_${width}x${width * 2}.${ext}`))
  );

  deletePromises.push(deleteImage(ctx, `${path}.${originalExt}`));

  await Promise.all(deletePromises);
}

async function deleteImage(ctx: Context, path: string) {
  const file = ctx.storage.bucket().file(path);
  if (await file.exists().then((res) => res[0])) await file.delete();
}
