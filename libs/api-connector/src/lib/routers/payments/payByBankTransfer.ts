import { hasCart } from '../../middlewares/hasCart';
import { isAuth } from '../../middlewares/isAuth';
import { publicProcedure } from '../../trpc';
import { convertCartToNewOrder, ensureCartWithAdditionalDataCanBeConvertedToOrder } from './utils';
import { additionalDataForPayment } from './dto';

export default publicProcedure
  .use(isAuth())
  .use(hasCart())
  .input(additionalDataForPayment)
  .mutation(async ({ ctx, input }) => {
    const { promotionCode } = await ensureCartWithAdditionalDataCanBeConvertedToOrder(ctx, ctx.cart, input);

    // Prepare order create payload
    const orderCreatePayloadFromCart = await convertCartToNewOrder(ctx, {
      ...input,
      promotionCode,
      paymentMethod: 'BANK_TRANSFER',
    }).catch((e) => {
      console.error('Error converting cart to order', e);
      throw e;
    });

    if (!Array.isArray(orderCreatePayloadFromCart.items)) {
      // do not handle other case from PrismaCreateManyInput
      throw 'Not handled order items should be an array.';
    }

    const [order] = await ctx.orm.$transaction([
      ctx.orm.order.create({
        data: {
          ...orderCreatePayloadFromCart,
          archivedAt: null,
          status: 'WAITING_BANK_TRANSFER',
        },
      }),
      ctx.orm.cart.delete({
        where: {
          id: ctx.cart.id,
        },
      }),
    ]);

    return order.reference;
  });
