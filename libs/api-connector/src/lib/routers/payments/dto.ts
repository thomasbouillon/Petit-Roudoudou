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
        country: z.string(),
      }),
      z.union([
        z.object({
          method: z.literal('colissimo' satisfies Order['shipping']['method']),
        }),
        z.object({
          method: z.literal('mondial-relay' satisfies Order['shipping']['method']),
          relayPoint: z.object({
            code: z.string(),
          }),
        }),
      ])
    ),
    z.object({
      method: z.literal('pickup-at-workshop' satisfies Order['shipping']['method']),
    }),
    z.object({
      method: z.literal('do-not-ship' satisfies Order['shipping']['method']),
    }),
  ]),
  extras: z.object({
    reduceManufacturingTimes: z.boolean(),
  }),
  promotionCode: z.string().nullable(),
});
