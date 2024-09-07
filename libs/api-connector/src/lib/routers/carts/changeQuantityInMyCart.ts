import { publicProcedure } from '../../trpc';
import { changeQuantityPayloadSchema } from './dto/changeQuantity';
import { isAuth } from '../../middlewares/isAuth';
import { hasCart } from '../../middlewares/hasCart';
import { cancelDraftOrder } from './utils';
import { TRPCError } from '@trpc/server';
import { ErrorCodes } from '@couture-next/utils';

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
            cause: ErrorCodes.NOT_ENOUGH_STOCK,
          });
        }
      } else if (item.type === 'customized') {
        if (!item.articleId) {
          throw new Error('ArticleId not found in cart item');
        }
        const linkedArticle = await ctx.orm.article.findUniqueOrThrow({
          where: { id: item.articleId },
        });
        if (input.newQuantity < (linkedArticle.minQuantity ?? 1)) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Quantity too low',
          });
        }
      }
      item.quantity = input.newQuantity;
    } else {
      ctx.cart.items.splice(itemIndex, 1);
    }

    const { id, draftOrderId, userId, ...newCartWithOutId } = ctx.cart;

    await ctx.orm.cart.update({
      where: { id },
      data: newCartWithOutId,
    });

    if (ctx.user.role !== 'ANONYMOUS') {
      await ctx.crm
        .sendEvent('cartUpdated', ctx.user.email, {})
        .catch((e) => console.warn('Failed to send event to crm', e));
    }

    return ctx.cart;
  });
