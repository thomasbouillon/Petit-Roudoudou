import { z } from 'zod';
import { publicProcedure } from '../../trpc';
import { TRPCError } from '@trpc/server';
import { Order } from '@prisma/client';
import { isAdmin } from '../../middlewares/isAdmin';
import { BoxtalCarrier } from '@couture-next/shipping';

type OrderShipping = Order['shipping'] & { deliveryMode: 'deliver-at-home' | 'deliver-at-pickup-point' };

export default publicProcedure
  .use(isAdmin())
  .input(
    z.object({
      orderId: z.string(),
      sendAt: z.date().transform((val) => val.toISOString().split('T')[0]),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const order = await ctx.orm.order.findUnique({
      where: { id: input.orderId },
      include: { user: true },
    });

    if (!order) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Order not found',
      });
    }

    if (order.shipping.deliveryMode === 'do-not-ship' || order.shipping.deliveryMode === 'pickup-at-workshop') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Order does not require shipping',
      });
    }

    const shippingClientRes = await ctx.shipping.buyShippingLabel({
      order: {
        reference: order.reference.toString(),
        totalTaxIncluded: order.totalTaxIncluded,
      },
      carrierId: order.shipping.carrierId as BoxtalCarrier,
      offerId: order.shipping.offerId,
      weight: order.totalWeight,
      sendAt: input.sendAt,
      sendToPickupPoint:
        order.shipping.deliveryMode === 'deliver-at-pickup-point' ? order.shipping.pickupPoint.code : undefined,
      recipient: {
        firstname: order.shipping.firstName,
        lastname: order.shipping.lastName,
        address: order.shipping.address,
        address2: order.shipping.addressComplement,
        zipCode: order.shipping.zipCode,
        city: order.shipping.city,
        country: order.shipping.country as 'FR' | 'BE' | 'CH',
        phone: order.shipping.phoneNumber,
        email: order.user.email,
      },
    });

    console.debug(shippingClientRes);

    await ctx.orm.$runCommandRaw({
      update: 'Order',
      updates: [
        {
          q: { _id: { $oid: input.orderId } },
          u: {
            $set: {
              'shipping.boxtalReference': shippingClientRes.reference satisfies OrderShipping['boxtalReference'],
              workflowStep: 'SHIPPING' satisfies Order['workflowStep'],
              // 'shipping.labelUrl': shippingClientRes.labels[0] satisfies OrderShipping['labelUrl'],
              'shipping.pricePaidByUs.taxIncluded': shippingClientRes.offer.price.taxIncluded satisfies NonNullable<
                OrderShipping['pricePaidByUs']
              >['taxIncluded'],
              'shipping.pricePaidByUs.taxExcluded': shippingClientRes.offer.price.taxExcluded satisfies NonNullable<
                OrderShipping['pricePaidByUs']
              >['taxExcluded'],
            },
          },
        },
      ],
    });
  });
