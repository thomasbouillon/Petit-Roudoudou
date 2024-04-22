import { Civility, Order } from '@prisma/client';
import { z } from 'zod';

export type AdditionalDataForPayment = z.infer<typeof additionalDataForPayment>;

export const additionalDataForPayment = z.object({
  giftCards: z.array(z.string()),
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
  shipping: z.union([
    z.intersection(
      z.object({
        civility: z.nativeEnum(Civility),
        firstName: z.string(),
        lastName: z.string(),
        address: z.string(),
        addressComplement: z.string(),
        city: z.string(),
        zipCode: z.string(),
        country: z.enum(['FR', 'BE', 'CH']),
        offerId: z.string().min(1),
        carrierId: z.string().min(1),
      }),
      z.discriminatedUnion('deliveryMode', [
        z.object({
          deliveryMode: z.literal('deliver-at-pickup-point' satisfies Order['shipping']['deliveryMode']),
          pickupPoint: z.object({
            name: z.string(),
            code: z.string(),
            address: z.string().min(1),
            city: z.string().min(1),
            zipCode: z.string().min(1),
            country: z.string().min(1),
          }),
        }),
        z.object({
          deliveryMode: z.literal('deliver-at-home' satisfies Order['shipping']['deliveryMode']),
        }),
      ])
    ),
    z.object({
      deliveryMode: z.literal('pickup-at-workshop' satisfies Order['shipping']['deliveryMode']),
    }),
    z.object({
      deliveryMode: z.literal('do-not-ship' satisfies Order['shipping']['deliveryMode']),
    }),
  ]),
  extras: z.object({
    reduceManufacturingTimes: z.boolean(),
  }),
  promotionCode: z.string().nullable(),
});
