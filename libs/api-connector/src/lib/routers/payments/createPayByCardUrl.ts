import { hasCart } from '../../middlewares/hasCart';
import { isAuth } from '../../middlewares/isAuth';
import { publicProcedure } from '../../trpc';
import {
  calcOrderTotalDiscount,
  convertCartToNewOrder,
  billingItemsFromOrder,
  ensureCartWithAdditionalDataCanBeConvertedToOrder,
} from './utils';
import { additionalDataForPayment } from './dto';
import { routes } from '@couture-next/routing';

export default publicProcedure
  .use(isAuth())
  .use(hasCart())
  .input(additionalDataForPayment)
  .mutation(async ({ ctx, input }) => {
    // let draftOrder = await ctx.orm.order.findUnique({
    //     where: {
    //         id: ctx.cart.draftOrderId,
    //     },
    // })

    // if(!draftOrder) {
    //     draftOrder = await ctx.orm.order.create({
    //         // todo
    //     } as any)
    // }

    const { promotionCode } = await ensureCartWithAdditionalDataCanBeConvertedToOrder(ctx, ctx.cart, input);

    // Prepare order create payload
    const orderCreatePayloadFromCart = await convertCartToNewOrder(ctx, {
      ...input,
      promotionCode,
      paymentMethod: 'CARD',
    }).catch((e) => {
      console.error('Error converting cart to order', e);
      throw e;
    });

    if (!Array.isArray(orderCreatePayloadFromCart.items)) {
      // do not handle other case from PrismaCreateManyInput
      throw 'Not handled order items should be an array.';
    }
    const billingSession = await ctx.billing.createProviderSession(
      orderCreatePayloadFromCart.reference.toString(),
      ctx.user.email,
      billingItemsFromOrder(orderCreatePayloadFromCart),
      new URL(
        routes().cart().confirm(orderCreatePayloadFromCart.reference.toString()),
        ctx.environment.FRONTEND_BASE_URL
      ).toString(),
      calcOrderTotalDiscount(orderCreatePayloadFromCart.items, orderCreatePayloadFromCart.shipping.price),
      orderCreatePayloadFromCart.billing.amountPaidWithGiftCards ?? 0
    );

    orderCreatePayloadFromCart.billing.checkoutSessionId = billingSession.sessionId;
    orderCreatePayloadFromCart.billing.checkoutSessionUrl = billingSession.public_id;

    await ctx.orm.order
      .create({
        data: {
          ...orderCreatePayloadFromCart,
          archivedAt: null,
          status: 'DRAFT',
        },
      })
      .catch((e) => {
        console.error('Error creating order', e);
        throw e;
      });

    return billingSession.public_id;
  });
