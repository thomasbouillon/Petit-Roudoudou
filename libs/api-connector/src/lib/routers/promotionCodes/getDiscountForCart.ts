import { z } from 'zod';
import { isAuth } from '../../middlewares/isAuth';
import { publicProcedure } from '../../trpc';
import { TRPCError } from '@trpc/server';
import { hasCartWithTotal } from '../../middlewares/hasCart';
import { getPromotionCodeDiscount } from '../payments/utils';

const payloadSchema = z.object({
  code: z.string(),
  shippingCost: z.number(),
  extras: z.object({
    reduceManufacturingTimes: z.boolean(),
  }),
});

export default publicProcedure
  .use(isAuth())
  .use(hasCartWithTotal())
  .input(payloadSchema)
  .query(async ({ ctx, input }) => {
    const promotionCode = await ctx.orm.promotionCode.findFirst({
      where: {
        code: input.code,
      },
    });

    if (!promotionCode) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Promotion code not found',
      });
    }

    const subTotalTaxIncludedWithOutGiftCardItems =
      ctx.cart.totalTaxIncluded -
      ctx.cart.items.reduce((acc, cartItem) => {
        if (cartItem.type === 'giftCard') {
          return acc + cartItem.totalTaxIncluded;
        }
        return acc;
      }, 0);

    if (
      (promotionCode.conditions.usageLimit && promotionCode.conditions.usageLimit <= promotionCode.used) ||
      (promotionCode.conditions.validUntil && promotionCode.conditions.validUntil.getTime() < Date.now()) ||
      (promotionCode.conditions.minAmount !== null &&
        promotionCode.conditions.minAmount >
          subTotalTaxIncludedWithOutGiftCardItems + (input.extras.reduceManufacturingTimes ? 15 : 0))
    ) {
      console.warn('Promotion code is not suitable for this cart');
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Promotion code not found' });
    }

    return {
      amount:
        promotionCode.type === 'FREE_SHIPPING' // todo check is md and FR
          ? input.shippingCost
          : getPromotionCodeDiscount(promotionCode, subTotalTaxIncludedWithOutGiftCardItems),
    };
  });
