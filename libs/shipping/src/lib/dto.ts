import { z } from 'zod';
import { knownCarriersWithServices } from './constants';
import { CarrierOffer } from './interface-contracts';

const pickupPointSchema = z.object({
  code: z.string(),
  name: z.string(),
  address: z.string(),
  city: z.string(),
  zipcode: z.number().transform((v) => v.toString()),
  country: z.string(),
  latitude: z.number(),
  longitude: z.number(),
});

export const pickupPointsResponseSchema = z.object({
  points: z
    .preprocess(
      (data) => {
        // No pickup points causes an empty string
        if (data === '') return { point: [] };
        return data;
      },
      z.object({
        point: z.array(pickupPointSchema),
      })
    )
    .transform((data) => data.point),
});

const singleOfferSchema = (ENABLE_VAT_PASS_THROUGH: boolean) =>
  z
    .object({
      operator: z.object({
        code: z.string(),
        label: z.string(),
        logo: z.string(),
      }),
      service: z.object({
        code: z.string(),
      }),
      price: z.object({
        'tax-exclusive': z.number(),
        'tax-inclusive': z.number(),
      }),
      delivery: z
        .object({
          date: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .transform((v) => {
              // transform to number of days
              const now = new Date();
              const deliveryDate = new Date(v);
              return Math.floor((deliveryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            }),
        })
        .transform((v) => ({ min: v.date, max: v.date + 1 })),
    })
    .transform(
      (rawOffer) =>
        ({
          carrierId: rawOffer.operator.code,
          carrierLabel: rawOffer.operator.label,
          carrierIconUrl: rawOffer.operator.logo,
          offerId: rawOffer.service.code,
          deliveryType: deliveryTypeFromCarrierAndService(rawOffer.operator.code, rawOffer.service.code),
          price: {
            taxIncluded: rawOffer.price['tax-inclusive'],
            taxExcluded: ENABLE_VAT_PASS_THROUGH ? rawOffer.price['tax-exclusive'] : rawOffer.price['tax-inclusive'],
          },
          deliveryTime: rawOffer.delivery,
        } satisfies CarrierOffer)
    );

const deliveryTypeFromCarrierAndService = (carrier: string, service: string) => {
  const carrierConfig = knownCarriersWithServices.find((cfg) => cfg.carrier === carrier);
  if (!carrierConfig) throw 'Unkown carrier';
  const carrierServiceConfig = carrierConfig.services.find((cfg) => cfg.code === service);
  if (!carrierServiceConfig) throw 'Unkown service for this carrier';
  return carrierServiceConfig.kind;
};

export const getOffersResponseSchema = (ENABLE_VAT_PASS_THROUGH: boolean) =>
  z
    .object({
      cotation: z.object({
        shipment: z.object({
          offer: z.preprocess(
            (v) => (v === undefined ? [] : Array.isArray(v) ? v : [v]),
            z.array(singleOfferSchema(ENABLE_VAT_PASS_THROUGH))
          ),
        }),
      }),
    })
    .transform((v) => ({ offers: v.cotation.shipment.offer }));

export const getOrderResponseSchema = (ENABLE_VAT_PASS_THROUGH: boolean) =>
  z.object({
    order: z.object({
      shipment: z.object({
        reference: z.string(),
        offer: z.preprocess(
          (v) => (v === undefined ? [] : Array.isArray(v) ? v : [v]),
          z
            .array(
              z.object({
                price: z
                  .object({
                    'tax-exclusive': z.number(),
                    'tax-inclusive': z.number(),
                  })
                  .transform((v) => ({
                    taxIncluded: v['tax-inclusive'],
                    taxExcluded: ENABLE_VAT_PASS_THROUGH ? v['tax-exclusive'] : v['tax-inclusive'],
                  })),
              })
            )
            .min(1)
            .transform((v) => {
              if (v.length > 1) console.warn('Found multiple offers', JSON.stringify(v));
              return v[0];
            })
        ),
        // labels: z.preprocess((v) => (v === undefined ? [] : Array.isArray(v) ? v : [v]), z.array(z.string())),
      }),
    }),
  });
