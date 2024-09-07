import { Cart, PromotionCode, OrderExtras, Prisma, User, Fabric, Order, Piping, EmbroideryColor } from '@prisma/client';
import { Context } from '../../context';
import {
  BillingOrderItem,
  CartItemCustomized,
  CartItemInStock,
  CartWithTotal,
  OrderItemCustomized,
  OrderItemGiftCard,
  OrderItemInStock,
  Taxes,
} from '@couture-next/types';
// import { BoxtalCarriers } from '@couture-next/shipping';
import { cartContainsCustomizedItems, firebaseServerImageLoader, removeTaxes } from '@couture-next/utils';
import { AdditionalDataForPayment } from './dto';
import { TRPCError } from '@trpc/server';
import { getSettingValue } from '../settings/getValue';
import { BoxtalCarrier } from '@couture-next/shipping';

type ContextWithCart = Context & { cart: CartWithTotal; user: User };

type AdditionalData = Omit<AdditionalDataForPayment, 'promotionCode'> & {
  promotionCode: PromotionCode | null;
  paymentMethod: Order['billing']['paymentMethod'];
};

export const convertCartToNewOrder = async (
  ctx: ContextWithCart,
  additionalPayload: AdditionalData
): Promise<
  Omit<Prisma.OrderCreateInput, 'status' | 'items' | 'shipping'> & {
    items: Order['items'];
    shipping: Order['shipping'];
  }
> => {
  const { shipping, billing } = additionalPayload;

  const { cart } = ctx;

  const taxes = { ...cart.taxes };
  let subTotalTaxExcluded = cart.totalTaxExcluded;
  let subTotalTaxIncluded = cart.totalTaxIncluded;

  const getShippingCostPromise =
    shipping.deliveryMode === 'pickup-at-workshop' || shipping.deliveryMode === 'do-not-ship'
      ? Promise.resolve({
          carrierId: 'roudoudou',
          carrierIconUrl: '',
          carrierLabel: 'Roudoudou',
          offerId: '',
          price: {
            taxIncluded: 0,
            taxExcluded: 0,
          },
        })
      : ctx.shipping
          .getPrice({
            carrierId: shipping.carrierId as BoxtalCarrier,
            offerId: shipping.offerId,
            weight: cart.totalWeight,
            country: shipping.country,
          })
          .catch((e) => {
            console.error('Failed to fetch prices!', e);
            throw new Error('Error while fetching shipping cost');
          });

  const containsAtLeastOneCustomizedItem = cart.items.some((item) => item.type === 'customized');
  const containsOnlyDigitalProducts = additionalPayload.shipping.deliveryMode === 'do-not-ship';
  const containsOnlyInStockItems = !containsAtLeastOneCustomizedItem && !containsOnlyDigitalProducts;

  const getManufacturingTimePromise = containsOnlyDigitalProducts
    ? Promise.resolve({
        min: 0,
        max: 0,
        unit: 'DAYS' as const,
      })
    : containsOnlyInStockItems
    ? Promise.resolve({
        min: 2,
        max: 2,
        unit: 'DAYS' as const,
      })
    : additionalPayload.extras.reduceManufacturingTimes
    ? Promise.resolve({
        min: 15,
        max: 15,
        unit: 'DAYS' as const,
      })
    : ctx.cms.getManufacturingTimes().then((res) => ({
        min: res.min,
        max: res.max,
        unit: res.unit.toUpperCase() as Uppercase<(typeof res)['unit']>,
      }));

  const getOffersPromise = ctx.cms.getOffers();

  const getReferencePromise = ctx.orm.order
    .aggregate({
      _max: {
        reference: true,
      },
    })
    .then((res) => (res._max.reference ?? 0) + 1);

  const getValidatedGiftCardsPromise = additionalPayload.giftCards
    ? ctx.orm.giftCard
        .findMany({
          where: {
            id: {
              in: additionalPayload.giftCards ?? [],
            },
          },
        })
        .then((giftCards) => {
          if (giftCards.length !== new Set(additionalPayload.giftCards ?? []).size) {
            throw new Error('Some gift cards were not found');
          }
          if (
            !giftCards.every(
              (giftCard) =>
                giftCard.status === 'CLAIMED' &&
                giftCard.amount > giftCard.consumedAmount &&
                giftCard.createdAt.getTime() + 365 * 24 * 60 * 60 * 1000 >= Date.now() &&
                giftCard.userId === ctx.user.id
            )
          ) {
            throw new Error('Some gift cards are not valid');
          }
          return giftCards;
        })
    : Promise.resolve([]);

  const customizableFabricIds = Array.from(
    new Set(
      cart.items
        .map((item) => {
          return item.type === 'giftCard'
            ? []
            : Object.values(item.customizations)
                .filter((c): c is typeof c & { type: 'fabric'; value: string } => c.type === 'fabric')
                .map((c) => c.value);
        })
        .flat()
    )
  );

  const prefetchChosenFabrics = (
    customizableFabricIds.length
      ? ctx.orm.fabric
          .findMany({
            where: {
              id: {
                in: customizableFabricIds,
              },
            },
          })
          .then((res) =>
            res.reduce((acc, fabric) => {
              acc[fabric.id] = fabric;
              return acc;
            }, {} as Record<string, Fabric>)
          )
      : Promise.resolve({})
  ).then((r) => {
    if (Object.keys(r).length !== customizableFabricIds.length) {
      throw new Error('Some fabrics were not found');
    }
    return r;
  });

  const customizablePipingIds = Array.from(
    new Set(
      cart.items
        .map((item) =>
          item.type === 'giftCard'
            ? []
            : Object.values(item.customizations)
                .filter((c): c is typeof c & { type: 'piping'; value: string } => c.type === 'piping')
                .map((c) => c.value)
        )
        .flat()
    )
  );
  const prefetchChosenPipings = (
    customizablePipingIds.length
      ? ctx.orm.piping
          .findMany({
            where: {
              id: {
                in: customizablePipingIds,
              },
            },
          })
          .then((res) =>
            res.reduce((acc, piping) => {
              acc[piping.id] = piping;
              return acc;
            }, {} as Record<string, Piping>)
          )
      : Promise.resolve({})
  ).then((r) => {
    if (Object.keys(r).length !== customizablePipingIds.length) {
      throw new Error('Some pipings were not found');
    }
    return r;
  });

  const customEmbroideryColorIds = Array.from(
    new Set(
      cart.items
        .map((item) =>
          item.type === 'giftCard'
            ? []
            : Object.values(item.customizations)
                .filter(
                  (c): c is typeof c & { type: 'embroidery'; value: { colorId: string; text: string } } =>
                    c.type === 'embroidery' && c.value !== undefined
                )
                .map((c) => c.value.colorId)
        )
        .flat()
    )
  );

  const prefetchChosenEmbroideryColors = (
    customEmbroideryColorIds.length
      ? ctx.orm.embroideryColor
          .findMany({
            where: {
              id: {
                in: customEmbroideryColorIds,
              },
            },
          })
          .then((res) =>
            res.reduce((acc, color) => {
              acc[color.id] = color;
              return acc;
            }, {} as Record<string, EmbroideryColor>)
          )
      : Promise.resolve({})
  ).then((r) => {
    if (Object.keys(r).length !== customEmbroideryColorIds.length) {
      throw new Error('Some embroidery colors were not found');
    }
    return r;
  });

  const [
    shippingCost,
    manufacturingTimes,
    offers,
    reference,
    validatedGiftCards,
    chosenFabrics,
    chosenPipings,
    chosenEmbroideryColors,
  ] = await Promise.all([
    getShippingCostPromise,
    getManufacturingTimePromise,
    getOffersPromise,
    getReferencePromise,
    getValidatedGiftCardsPromise,
    prefetchChosenFabrics,
    prefetchChosenPipings,
    prefetchChosenEmbroideryColors,
  ]);

  // Calculate total of items that are gift cards
  const subTotalTaxIncludedOnlyGiftCardItems = cart.items.reduce((acc, cartItem) => {
    if (cartItem.type === 'giftCard') {
      return acc + cartItem.totalTaxIncluded;
    }
    return acc;
  }, 0);

  let promotionCodeDiscountRate = 0;
  if (additionalPayload.promotionCode) {
    const subTotalWithOutGiftCardItems = subTotalTaxIncluded - subTotalTaxIncludedOnlyGiftCardItems;
    promotionCodeDiscountRate =
      getPromotionCodeDiscount(additionalPayload.promotionCode, subTotalWithOutGiftCardItems) /
      subTotalWithOutGiftCardItems;
    subTotalTaxExcluded -= promotionCodeDiscountRate * subTotalTaxExcluded;
    subTotalTaxIncluded -= promotionCodeDiscountRate * subTotalTaxIncluded;
    Object.entries(taxes).forEach(([tax]) => {
      const taxKey = parseInt(tax) as Taxes;
      taxes[taxKey]! *= 1 - promotionCodeDiscountRate;
    });
  }
  const subTotalTaxIncludedWithOutGiftCardItems = subTotalTaxIncluded - subTotalTaxIncludedOnlyGiftCardItems;

  let totalTaxExcluded = subTotalTaxExcluded;
  let totalTaxIncluded = subTotalTaxIncluded;

  // Apply extras
  const orderExtras: OrderExtras = {
    reduceManufacturingTimes: null,
  };
  if (additionalPayload.extras.reduceManufacturingTimes) {
    orderExtras.reduceManufacturingTimes = {
      priceTaxExcluded: removeTaxes(15),
      priceTaxIncluded: 15,
    };
    totalTaxExcluded += removeTaxes(15);
    totalTaxIncluded += 15;
    taxes[Taxes.VAT_20] = (taxes[Taxes.VAT_20] ?? 0) + (15 - removeTaxes(15));
  }

  // Apply shipping costs
  const offerFreeShipping =
    // promotion code
    additionalPayload.promotionCode?.type === 'FREE_SHIPPING' ||
    // free shipping for md relay after threshold
    (offers.freeShippingThreshold !== null &&
      subTotalTaxIncludedWithOutGiftCardItems >= offers.freeShippingThreshold &&
      shipping.deliveryMode === 'deliver-at-pickup-point' &&
      shipping.carrierId === 'MONR' &&
      ['FR', 'BE'].includes(shipping.country));

  if (!offerFreeShipping) {
    totalTaxExcluded += shippingCost.price.taxExcluded;
    totalTaxIncluded += shippingCost.price.taxIncluded;
    taxes[Taxes.VAT_20] =
      (taxes[Taxes.VAT_20] ?? 0) + (shippingCost.price.taxIncluded - shippingCost.price.taxExcluded);
  }

  // Append gift if order is eligible
  const addGiftToOrder =
    offers.giftThreshold !== null && subTotalTaxIncludedWithOutGiftCardItems >= offers.giftThreshold;

  // Round to two decimals
  totalTaxExcluded = roundToTwoDecimals(totalTaxExcluded);
  totalTaxIncluded = roundToTwoDecimals(totalTaxIncluded);
  subTotalTaxExcluded = roundToTwoDecimals(subTotalTaxExcluded);
  subTotalTaxIncluded = roundToTwoDecimals(subTotalTaxIncluded);
  shippingCost.price.taxExcluded = roundToTwoDecimals(shippingCost.price.taxExcluded);
  shippingCost.price.taxIncluded = roundToTwoDecimals(shippingCost.price.taxIncluded);
  Object.entries(taxes).forEach(([tax, value]) => {
    const taxKey = parseInt(tax) as Taxes;
    taxes[taxKey] = roundToTwoDecimals(value);
  });
  Object.values(orderExtras).forEach((extra) => {
    if (!extra) return;
    extra.priceTaxExcluded = roundToTwoDecimals(extra.priceTaxExcluded);
    extra.priceTaxIncluded = roundToTwoDecimals(extra.priceTaxIncluded);
  });

  // Deduct gift cards
  let totalPaidByGiftCards = 0;
  let amountByGiftCards = {} as Record<string, number>;
  validatedGiftCards.forEach((giftCard) => {
    const remaining = Math.max(0, totalTaxIncluded - totalPaidByGiftCards);
    const amount = Math.min(giftCard.amount - giftCard.consumedAmount, remaining);
    totalPaidByGiftCards += amount;
    amountByGiftCards[giftCard.id] = amount;
  });

  return {
    reference,
    manufacturingTimes,
    totalTaxExcluded,
    totalTaxIncluded,
    subTotalTaxExcluded,
    subTotalTaxIncluded,
    totalWeight: cart.totalWeight,
    taxes,
    extras: orderExtras,
    promotionCode: additionalPayload.promotionCode ? trimPromotionCode(additionalPayload.promotionCode) : null,
    user: { connect: { id: ctx.user.id } },
    giftOffered: addGiftToOrder,
    shipping: {
      ...shipping,
      carrierIconUrl: shippingCost.carrierIconUrl,
      carrierId: shippingCost.carrierId,
      carrierLabel: shippingCost.carrierLabel,
      offerId: shippingCost.offerId,
      price: {
        taxExcluded: offerFreeShipping ? 0 : shippingCost.price.taxExcluded,
        taxIncluded: offerFreeShipping ? 0 : shippingCost.price.taxIncluded,
        originalTaxExcluded: shippingCost.price.taxExcluded,
        originalTaxIncluded: shippingCost.price.taxIncluded,
      } satisfies PrismaJson.OrderShipping['price'],
    } as PrismaJson.OrderShipping,
    billing: {
      ...billing,
      paymentMethod: additionalPayload.paymentMethod,
      giftCards: amountByGiftCards satisfies PrismaJson.OrderBillingGiftCards,
      amountPaidWithGiftCards: totalPaidByGiftCards,
    },
    items: cart.items.map((cartItem) => {
      const commonProps = {
        weight: cartItem.totalWeight,
        description: cartItem.description,
        image: cartItem.image,
        quantity: cartItem.quantity,
        customerComment: cartItem.comment,
        originalPerUnitTaxExcluded: roundToTwoDecimals(cartItem.perUnitTaxExcluded),
        originalPerUnitTaxIncluded: roundToTwoDecimals(cartItem.perUnitTaxIncluded),
        originalTotalTaxExcluded: roundToTwoDecimals(cartItem.totalTaxExcluded),
        originalTotalTaxIncluded: roundToTwoDecimals(cartItem.totalTaxIncluded),
        taxes: Object.entries(cartItem.taxes).reduce((acc, [tax, value]) => {
          acc[tax] = roundToTwoDecimals(value * (1 - promotionCodeDiscountRate));
          return acc;
        }, {} as Record<string, number>),
      } satisfies Partial<PrismaJson.OrderItem>;

      if (cartItem.type === 'giftCard') {
        return {
          type: cartItem.type,
          ...commonProps,
          // Cannot apply promotion to gift cards
          totalTaxExcluded: roundToTwoDecimals(cartItem.totalTaxExcluded),
          totalTaxIncluded: roundToTwoDecimals(cartItem.totalTaxIncluded),
          perUnitTaxExcluded: roundToTwoDecimals(cartItem.perUnitTaxExcluded),
          perUnitTaxIncluded: roundToTwoDecimals(cartItem.perUnitTaxIncluded),
          details: {
            amount: cartItem.amount,
            recipient: cartItem.recipient,
            text: cartItem.text,
          },
        } satisfies OrderItemGiftCard;
      } else if (cartItem.type === 'customized') {
        return {
          type: cartItem.type,
          ...commonProps,
          customizations: cartItemToOrderItemCustomizations(
            cartItem,
            chosenFabrics,
            chosenPipings,
            chosenEmbroideryColors
          ),
          totalTaxExcluded: roundToTwoDecimals(cartItem.totalTaxExcluded * (1 - promotionCodeDiscountRate)),
          totalTaxIncluded: roundToTwoDecimals(cartItem.totalTaxIncluded * (1 - promotionCodeDiscountRate)),
          perUnitTaxExcluded: roundToTwoDecimals(cartItem.perUnitTaxExcluded * (1 - promotionCodeDiscountRate)),
          perUnitTaxIncluded: roundToTwoDecimals(cartItem.perUnitTaxIncluded * (1 - promotionCodeDiscountRate)),
          originalArticleId: cartItem.articleId,
        } satisfies OrderItemCustomized;
      } else if (cartItem.type === 'inStock') {
        return {
          type: cartItem.type,
          ...commonProps,
          customizations: cartItemToOrderItemCustomizations(
            cartItem,
            chosenFabrics,
            chosenPipings,
            chosenEmbroideryColors
          ) as OrderItemInStock['customizations'],
          totalTaxExcluded: roundToTwoDecimals(cartItem.totalTaxExcluded * (1 - promotionCodeDiscountRate)),
          totalTaxIncluded: roundToTwoDecimals(cartItem.totalTaxIncluded * (1 - promotionCodeDiscountRate)),
          perUnitTaxExcluded: roundToTwoDecimals(cartItem.perUnitTaxExcluded * (1 - promotionCodeDiscountRate)),
          perUnitTaxIncluded: roundToTwoDecimals(cartItem.perUnitTaxIncluded * (1 - promotionCodeDiscountRate)),
          originalStockId: cartItem.stockUid,
          originalArticleId: cartItem.articleId,
        } satisfies OrderItemInStock;
      }
      throw new Error('Unknown item type');
    }),
  };
};

function roundToTwoDecimals(value: number) {
  return Math.round(value * 100) / 100;
}

function cartItemToOrderItemCustomizations(
  cartItem: CartItemInStock | CartItemCustomized,
  fabrics: Record<string, Fabric>,
  pipings: Record<string, Piping>,
  embroideryColors: Record<string, EmbroideryColor>
): OrderItemCustomized['customizations'] | OrderItemInStock['customizations'] {
  return Object.values(cartItem.customizations ?? {}).map(({ value, type, title }) => {
    if (type === 'text') {
      return {
        title,
        value,
        type: 'text',
      };
    } else if (type === 'boolean') {
      return {
        title,
        value: value ? 'Oui' : 'Non',
        type: 'boolean',
      };
    } else if (type === 'fabric') {
      const fabric = fabrics[value];
      if (!fabric) throw new Error('Fabric not found');
      return {
        title,
        value: fabric.name,
        type: 'fabric',
      };
    } else if (type === 'piping') {
      const piping = pipings[value];
      if (!piping) throw new Error('Piping not found');
      return {
        title,
        value: piping.name,
        type: 'piping',
      };
    } else if (type === 'embroidery') {
      if (!value)
        return {
          title,
          value: 'Non',
          type: 'embroidery',
        };
      const embroideryColor = embroideryColors[value.colorId];
      if (!embroideryColor) throw new Error('Embroidery color not found');
      return {
        title,
        value: `${value.text} (${embroideryColor.name})`,
        type: 'embroidery',
      };
    } else {
      throw new Error('Unknown customizable type');
    }
  });
}
export function getPromotionCodeDiscount<T extends Pick<PromotionCode, 'type' | 'discount'>>(
  code: T,
  subTotalTaxIncludedWithOutGiftCardItems: number
) {
  if (code.type === 'FREE_SHIPPING') return 0;
  if (code.discount === undefined) throw new Error('Discount is undefined');
  return code.type === 'PERCENTAGE'
    ? subTotalTaxIncludedWithOutGiftCardItems * (code.discount! / 100)
    : Math.min(code.discount!, subTotalTaxIncludedWithOutGiftCardItems);
}

export function billingItemsFromOrder(
  order: Pick<Order | Prisma.OrderCreateInput, 'giftOffered' | 'extras'> & {
    items: Order['items'];
    shipping: Order['shipping'];
  }
): BillingOrderItem[] {
  if (!Array.isArray(order.items)) {
    // do not handle other case from PrismaCreateManyInput
    throw 'Not handled order items should be an array.';
  }

  const r: BillingOrderItem[] = order.items.map((item) => ({
    label: item.description,
    image: firebaseServerImageLoader()({ src: item.image.url, width: 256 }),
    price: Math.round(item.originalPerUnitTaxIncluded * 100),
    quantity: item.quantity,
    quantity_unit: '',
  }));
  if (order.giftOffered) {
    r.push({
      label: 'Cadeau',
      price: 0,
      quantity: 1,
      quantity_unit: '',
    });
  }
  if (order.shipping.price.originalTaxIncluded > 0) {
    r.push({
      label: 'Frais de port',
      price: Math.round(order.shipping.price.originalTaxIncluded * 100),
      quantity: 1,
      quantity_unit: '',
    });
  }
  if (order.extras.reduceManufacturingTimes?.priceTaxIncluded) {
    r.push({
      label: 'Supplément commande urgente',
      price: Math.round(order.extras.reduceManufacturingTimes.priceTaxIncluded * 100),
      quantity: 1,
      quantity_unit: '',
    });
  }
  return r;
}

export function calcOrderTotalDiscount(items: Order['items'], shippingPrice: Order['shipping']['price']): number {
  return Math.round(
    items.reduce((acc, item) => acc + (item.originalTotalTaxIncluded - item.totalTaxIncluded), 0) * 100 +
      (shippingPrice.originalTaxIncluded - shippingPrice.taxIncluded) * 100
  );
}

function trimPromotionCode(promotionCode: PromotionCode): Order['promotionCode'] {
  return {
    code: promotionCode.code,
    conditions: promotionCode.conditions,
    discount: promotionCode.discount,
    type: promotionCode.type,
    filters: promotionCode.filters,
    used: promotionCode.used,
  };
}

export async function ensureCartWithAdditionalDataCanBeConvertedToOrder(
  ctx: Context,
  cart: CartWithTotal,
  additionalData: AdditionalDataForPayment
) {
  // Retrieve promotion code
  const promotionCode = additionalData.promotionCode
    ? await ctx.orm.promotionCode.findUnique({
        where: {
          code: additionalData.promotionCode,
        },
      })
    : null;

  if (additionalData.promotionCode && !promotionCode) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Invalid promotion code',
    });
  }

  // check if promotion code is suitable for this cart
  if (
    promotionCode &&
    ((promotionCode.conditions.usageLimit && promotionCode.conditions.usageLimit <= promotionCode.used) ||
      (promotionCode.conditions.validUntil && promotionCode.conditions.validUntil.getTime() < Date.now()) ||
      (promotionCode.conditions.minAmount !== null &&
        promotionCode.conditions.minAmount >
          cart.totalTaxIncluded + (additionalData.extras.reduceManufacturingTimes ? 15 : 0)))
  ) {
    console.warn('Promotion code is not suitable for this cart');
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Invalid promotion code',
    });
  }

  // If cart has customized items, ensure orders with customized items are enabled in settings
  if (cartContainsCustomizedItems(cart)) {
    const allowNewOrdersWithCustomArticles = await getSettingValue(ctx, 'allowNewOrdersWithCustomArticles');
    if (!allowNewOrdersWithCustomArticles) {
      console.error('Setting allowNewOrdersWithCustomArticles not enabled');
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Customized articles not allowed for now',
      });
    }
  }

  // If cart has reduced manufacturing times extra, ensure orders with reduced manufacturing times are enabled in settings
  if (additionalData.extras.reduceManufacturingTimes) {
    const allowNewOrdersWithReducedManufacturingTimes = await getSettingValue(
      ctx,
      'allowNewOrdersWithReducedManufacturingTimes'
    );
    if (!allowNewOrdersWithReducedManufacturingTimes) {
      console.error('Setting allowNewOrdersWithReducedManufacturingTimes not enabled');
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Reduced manufacturing times not allowed for now',
      });
    }
  }
  return { promotionCode };
}
