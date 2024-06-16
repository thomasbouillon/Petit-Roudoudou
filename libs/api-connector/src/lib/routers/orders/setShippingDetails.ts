import { z } from 'zod';
import { middleware, publicProcedure } from '../../trpc';
import { TRPCError } from '@trpc/server';
import { Order } from '@prisma/client';
import { Context } from '../../context';
import { getPublicUrl } from '@couture-next/utils';

const eventSchema = z.object({
  orderReference: z.string(),
  labelUrl: z.string(),
  trackingNumber: z.string(),
});

type OrderShipping = Order['shipping'] & { deliveryMode: 'deliver-at-home' | 'deliver-at-pickup-point' };

export default publicProcedure
  .use(
    middleware(({ ctx, next }) => {
      const m2mToken = ctx.auth.m2m.getToken();
      if (!m2mToken || !ctx.auth.m2m.verifyToken(m2mToken)) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Unauthorized',
        });
      }
      return next({ ctx });
    })
  )
  .input(eventSchema)
  .mutation(async ({ ctx, input }) => {
    const order = await ctx.orm.order.findUnique({
      where: { reference: parseInt(input.orderReference) },
      include: { user: true },
    });

    if (!order) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Order not found',
      });
    }

    const shippingLabel = await saveLabelFromUrl(ctx, order.id, input.labelUrl);

    const updatePayload = {
      $set: {
        'shipping.shippingLabel': shippingLabel satisfies NonNullable<OrderShipping['shippingLabel']>,
        'shipping.trackingNumber': input.trackingNumber satisfies NonNullable<OrderShipping['trackingNumber']>,
      },
    };

    await ctx.orm.$runCommandRaw({
      update: 'Order',
      updates: [
        {
          q: { _id: { $oid: order.id } },
          u: updatePayload as any,
        },
      ],
    });

    await ctx.mailer.sendEmail(
      'order-sent',
      {
        email: order.user.email,
        firstname: order.user.firstName ?? '',
        lastname: order.user.lastName ?? '',
      },
      { ORDER_TRACKING_NUMBER: input.trackingNumber }
    );
  });

async function saveLabelFromUrl(ctx: Context, orderId: string, labelUrl: string) {
  const fileUid = `orders/${orderId}/shippingLabel.pdf`;
  const fileRef = ctx.storage.bucket().file(fileUid);
  const stream = await ctx.shipping.fetchLabel(labelUrl);
  await fileRef.save(stream);
  return {
    uid: fileUid,
    url: getPublicUrl(fileUid, ctx.environment),
  };
}
