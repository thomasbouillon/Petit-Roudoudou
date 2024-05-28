import { middleware, publicProcedure } from '../../trpc';
import { TRPCError } from '@trpc/server';
import { CarrierOffer } from '@couture-next/shipping';
import { EstimatedShipping } from '@prisma/client';
import { Context } from '../../context';

// TODO provide context auth to check M2M + protect route + test direct + test CRON

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
  .mutation(async ({ ctx }) => {
    const articleIds = await ctx.orm.article
      .findMany({
        select: {
          id: true,
        },
      })
      .then((articles) => articles.map((article) => article.id));

    for (const articleId of articleIds) {
      await syncArticleShippingDetails(ctx, articleId);
    }
  });

async function syncArticleShippingDetails(ctx: Context, articleId: string) {
  const article = await ctx.orm.article.findUnique({
    where: {
      id: articleId,
    },
  });
  if (!article) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Article not found',
    });
  }

  const possibleWeights = Array.from(new Set(article.skus.map((sku) => sku.weight)));
  const possibleCountries = ['FR', 'CH', 'BE'] as const;

  // Fetch all shipping offers for all possible weights and countries
  const allShippingOffers = await Promise.all(
    possibleWeights.map(async (weight) => {
      const offerForWeight = await Promise.all(
        possibleCountries.map(async (country) => {
          const offersForCountryAndWeight = await ctx.shipping
            .getOffers({
              weight,
              country,
            })
            .catch((err) => {
              console.warn(`Failed to fetch shipping offers for weight ${weight} and country ${country}`, err);
              return [];
            });
          return {
            country,
            offers: offersForCountryAndWeight,
          };
        })
      );
      return {
        weight,
        offersByCountry: offerForWeight,
      };
    })
  );

  // Find cheapest offer by delivery mode
  const shippingDetailsByWeight = {} as Record<
    number,
    {
      country: string;
      deliverAtHomeOffer?: CarrierOffer;
      deliverAtPickupPointOffer?: CarrierOffer;
    }
  >;

  allShippingOffers.forEach((shippingOffersForWeight) => {
    shippingOffersForWeight.offersByCountry.forEach(({ country, offers }) => {
      // Find cheapest for a given country
      let cheapestDeliverAtHomeOffer: CarrierOffer | undefined = undefined;
      let cheapestDeliverAtPickupPointOffer: CarrierOffer | undefined = undefined;
      offers.forEach((offer) => {
        if (
          offer.deliveryType === 'deliver-at-home' &&
          (!cheapestDeliverAtHomeOffer || offer.price.taxIncluded < cheapestDeliverAtHomeOffer.price.taxIncluded)
        ) {
          cheapestDeliverAtHomeOffer = offer;
        } else if (
          offer.deliveryType === 'deliver-at-pickup-point' &&
          (!cheapestDeliverAtPickupPointOffer ||
            offer.price.taxIncluded < cheapestDeliverAtPickupPointOffer.price.taxIncluded)
        ) {
          cheapestDeliverAtPickupPointOffer = offer;
        }
      });
      shippingDetailsByWeight[shippingOffersForWeight.weight] = {
        country,
        deliverAtHomeOffer: cheapestDeliverAtHomeOffer,
        deliverAtPickupPointOffer: cheapestDeliverAtPickupPointOffer,
      };
    });
  });

  // TODO do not update if no changes

  const newSkuShippingDetails: (EstimatedShipping[] | null)[] = article.skus.map((sku) => {
    const shippingDetails = shippingDetailsByWeight[sku.weight];
    const res = [] as EstimatedShipping[];
    if (shippingDetails.deliverAtHomeOffer) {
      res.push({
        countryCode: shippingDetails.country,
        minDays: 123,
        maxDays: 123,
        mode: 'deliver-at-home',
        priceTaxIncluded: shippingDetails.deliverAtHomeOffer.price.taxIncluded,
      });
    }
    if (shippingDetails.deliverAtPickupPointOffer) {
      res.push({
        countryCode: shippingDetails.country,
        minDays: 123,
        maxDays: 123,
        mode: 'deliver-at-pickup-point',
        priceTaxIncluded: shippingDetails.deliverAtPickupPointOffer.price.taxIncluded,
      });
    }
    if (res.length === 0) return null;
    return res;
  });

  const toUpdate = {} as Record<string, EstimatedShipping[]>;
  article.skus.forEach((_, idx) => {
    const details = newSkuShippingDetails[idx];
    if (details === null) return;
    toUpdate[`skus.${idx}.estimatedShippingDetails`] = details;
  });

  console.log('Updating article', article.id, 'with', { $set: toUpdate });

  await ctx.orm.$runCommandRaw({
    update: 'Article',
    updates: [
      {
        q: {
          _id: { $oid: article.id },
        },
        u: {
          $set: toUpdate,
        },
      },
    ],
  });
}
