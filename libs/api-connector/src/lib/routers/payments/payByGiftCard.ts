import { hasCartWithTotal } from '../../middlewares/hasCart';
import { isAuth } from '../../middlewares/isAuth';
import { publicProcedure } from '../../trpc';
import { convertCartToNewOrder, ensureCartWithAdditionalDataCanBeConvertedToOrder } from './utils';
import { additionalDataForPayment } from './dto';
import { onOrderSubmittedHook } from './hooks/onOrderSubmittedHook';
import { onOrderPaidHook } from './hooks/onOrderPaidHook';

export default publicProcedure
  .use(isAuth())
  .use(hasCartWithTotal())
  .input(additionalDataForPayment)
  .mutation(async ({ ctx, input }) => {
    const { promotionCode } = await ensureCartWithAdditionalDataCanBeConvertedToOrder(ctx, ctx.cart, input);

    // Prepare order create payload
    const orderCreatePayloadFromCart = await convertCartToNewOrder(ctx, {
      ...input,
      promotionCode,
      paymentMethod: 'GIFT_CARD',
    }).catch((e) => {
      console.error('Error converting cart to order', e);
      throw e;
    });

    if (!Array.isArray(orderCreatePayloadFromCart.items)) {
      // do not handle other case from PrismaCreateManyInput
      throw 'Not handled order items should be an array.';
    }

    const order = await ctx.orm.$transaction(async ($transaction) => {
      const order = await $transaction.order.create({
        data: {
          ...orderCreatePayloadFromCart,
          archivedAt: null,
          status: 'PAID',
          paidAt: new Date(),
          workflowStep: 'PRODUCTION',
        },
        include: {
          user: true,
        },
      });

      await $transaction.cart.delete({
        where: {
          id: ctx.cart.id,
        },
      });

      await onOrderSubmittedHook(ctx, $transaction, order).catch((e) => {
        console.error('Error handling side effects of order submission', e);
        throw e;
      });

      return order;
    });

    await onOrderPaidHook(ctx, order);

    return order.reference;
  });
