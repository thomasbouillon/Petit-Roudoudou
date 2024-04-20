import { publicProcedure } from '../../trpc';
import { changeQuantityPayloadSchema } from './dto/changeQuantity';
import { isAuth } from '../../middlewares/isAuth';
import { hasCart } from '../../middlewares/hasCart';
import { cancelDraftOrder } from './utils';
import { Taxes } from '@couture-next/types';
import { Cart } from '@prisma/client';
import { TRPCError } from '@trpc/server';

export default publicProcedure
  .use(isAuth({ allowAnonymous: true }))
  .use(hasCart())
  .input(changeQuantityPayloadSchema)
  .mutation(async ({ ctx, input }) => {
    // TODO add locks at database layer to ensure consistency
    const itemIndex = ctx.cart.items.findIndex((item) => item.uid === input.itemUid);
    if (itemIndex < 0) {
      throw new Error('Item not found');
    }

    await cancelDraftOrder(ctx, ctx.cart);

    if (input.newQuantity > 0) {
      const item = ctx.cart.items[itemIndex];
      if (item.type === 'inStock') {
        if (!item.stockUid || !item.articleId) {
          throw new Error('StockUid or ArticleId not found in cart item');
        }
        // If related to an article
        const linkedArticle = await ctx.orm.article.findUniqueOrThrow({
          where: { id: item.articleId },
        });
        const correspondingArticleStock = linkedArticle.stocks.find((stock) => stock.uid === item.stockUid);
        if (!correspondingArticleStock) {
          throw new Error('Stock not found');
        }
        if (correspondingArticleStock.stock < input.newQuantity) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Not enough stock',
          });
        }
      }
      const prevQuantity = item.quantity;
      const perItemWeight = item.totalWeight / prevQuantity;
      item.quantity = input.newQuantity;
      item.totalTaxExcluded = item.perUnitTaxExcluded * item.quantity;
      item.totalTaxIncluded = item.perUnitTaxIncluded * item.quantity;
      item.totalWeight = perItemWeight * item.quantity;
      item.taxes = {
        [Taxes.VAT_20]: item.totalTaxIncluded - item.totalTaxExcluded,
      };
    } else {
      ctx.cart.items.splice(itemIndex, 1);
    }

    const [totalTaxExcluded, totalTaxIncluded, taxes, totalWeight] = ctx.cart.items.reduce(
      ([totalTaxExcluded, totalTaxIncluded, taxes, totalWeight], item) => {
        // update taxes
        Object.entries(item.taxes).forEach(([taxName, taxAmount]) => {
          taxes[taxName] = taxes[taxName] ?? 0 + taxAmount;
        });
        return [
          totalTaxExcluded + item.totalTaxExcluded,
          totalTaxIncluded + item.totalTaxIncluded,
          taxes,
          totalWeight + item.totalWeight,
        ];
      },
      [0, 0, {} as Cart['taxes'], 0]
    );

    ctx.cart.totalTaxExcluded = totalTaxExcluded;
    ctx.cart.totalTaxIncluded = totalTaxIncluded;
    ctx.cart.taxes = taxes;
    ctx.cart.totalWeight = totalWeight;

    // TODO notify crm

    const { id, ...newCartWithOutId } = ctx.cart;

    await ctx.orm.cart.update({
      where: { id },
      data: newCartWithOutId,
    });

    return ctx.cart;
  });
