import { isAuth } from '../../middlewares/isAuth';
import { publicProcedure } from '../../trpc';
import { billingItemsFromOrder } from './utils';
import { routes } from '@couture-next/routing';
import { z } from 'zod';
import { Civility, Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { applyTaxes, getTaxes } from '@couture-next/utils';
import { Context } from '../../context';
import { Taxes } from '@couture-next/types';

export default publicProcedure
  .use(isAuth())
  .input(
    z.object({
      workshopSessionId: z.string(),
      billing: z.object({
        civility: z.nativeEnum(Civility),
        firstName: z.string(),
        lastName: z.string(),
        address: z.string(),
        addressComplement: z.string(),
        city: z.string(),
        zipCode: z.string(),
        country: z.string(),
      }),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const workshopSession = await ctx.orm.workshopSession.findUnique({
      where: {
        id: input.workshopSessionId,
      },
    });
    if (!workshopSession) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Workshop session not found',
      });
    }

    if (workshopSession.endDate < new Date()) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Workshop session is already over',
      });
    }

    if (workshopSession.remainingCapacity <= 0) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Workshop session is full',
      });
    }

    const newOrderPayload: Prisma.OrderCreateInput = {
      billing: {
        checkoutSessionId: 'is-not-set-yet',
        checkoutSessionUrl: 'is-not-set-yet',
        ...input.billing,
        giftCards: [],
        paymentMethod: 'CARD',
        amountPaidWithGiftCards: 0,
      },
      items: [
        {
          type: 'workshopSession',
          description: 'Atelier | ' + workshopSession.title,
          totalTaxExcluded: workshopSession.price,
          totalTaxIncluded: applyTaxes(workshopSession.price),
          perUnitTaxExcluded: workshopSession.price,
          perUnitTaxIncluded: applyTaxes(workshopSession.price),
          originalPerUnitTaxExcluded: workshopSession.price,
          originalPerUnitTaxIncluded: applyTaxes(workshopSession.price),
          originalTotalTaxExcluded: workshopSession.price,
          originalTotalTaxIncluded: applyTaxes(workshopSession.price),
          workshopId: workshopSession.id,
          details: {
            date: workshopSession.startDate.toISOString(),
            location: workshopSession.location,
          },
          image: workshopSession.image, // TODO copy instead of moving when submitting
          quantity: 1,
          taxes: {
            [Taxes.VAT_20]: getTaxes(workshopSession.price),
          },
          weight: 0,
        },
      ],
      extras: {},
      giftOffered: false,
      reference: await getNextReference(ctx),
      shipping: {
        deliveryMode: 'do-not-ship',
        price: {
          originalTaxExcluded: 0,
          originalTaxIncluded: 0,
          taxExcluded: 0,
          taxIncluded: 0,
        },
      },
      status: 'DRAFT',
      user: {
        connect: {
          id: ctx.user.id,
        },
      },
      taxes: {
        [Taxes.VAT_20]: getTaxes(workshopSession.price),
      },
      subTotalTaxExcluded: workshopSession.price,
      subTotalTaxIncluded: applyTaxes(workshopSession.price),
      totalTaxExcluded: workshopSession.price,
      totalTaxIncluded: applyTaxes(workshopSession.price),
      totalWeight: 0,
    };

    const billingSession = await ctx.billing.createProviderSession(
      newOrderPayload.reference.toString(),
      ctx.user.email,
      billingItemsFromOrder(newOrderPayload),
      new URL(routes().cart().confirm(newOrderPayload.reference), ctx.environment.FRONTEND_BASE_URL).toString(),
      0,
      0
    );

    newOrderPayload.billing.checkoutSessionId = billingSession.sessionId;
    newOrderPayload.billing.checkoutSessionUrl = billingSession.public_id;
    newOrderPayload.archivedAt = null;

    await ctx.orm.order
      .create({
        data: newOrderPayload,
      })
      .catch((e) => {
        console.error('Error creating order', e);
        throw e;
      });

    return billingSession.public_id;
  });

async function getNextReference(ctx: Context) {
  const result = await ctx.orm.order.aggregate({
    _max: {
      reference: true,
    },
  });

  return (result._max.reference ?? 0) + 1;
}
