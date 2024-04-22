import { z } from 'zod';
import { hasCart } from '../../middlewares/hasCart';
import { publicProcedure } from '../../trpc';
import { isAuth } from '../../middlewares/isAuth';
import { CarrierOffer } from '@couture-next/shipping';

const additionalConstrainsSchema = z.object({
  country: z.enum(['FR', 'BE', 'CH']),
});

type ShippingOffer = Omit<CarrierOffer, 'deliveryType'> & {
  deliveryType: CarrierOffer['deliveryType'] | 'pickup-at-workshop';
};

export default publicProcedure
  .use(isAuth())
  .use(hasCart())
  .input(additionalConstrainsSchema)
  .query(async ({ ctx, input }) => {
    if (!ctx.cart.totalWeight) return [];
    const providerOffers: ShippingOffer[] = await ctx.shipping.getOffers({
      country: input.country,
      weight: ctx.cart.totalWeight,
    });
    if (input.country === 'FR' && providerOffers.length) {
      providerOffers.unshift({
        carrierId: 'roudoudou',
        carrierLabel: "Retrait à l'atelier",
        deliveryType: 'pickup-at-workshop',
        carrierIconUrl: '',
        offerId: 'pickup-at-workshop',
        price: {
          taxExcluded: 0,
          taxIncluded: 0,
        },
      });
    }
    return providerOffers;
  });
