import { Cart, PromotionCode, OrderExtras, Prisma, User, Fabric, Order } from '@prisma/client';
import { Context } from '../../context';
import {
  Article,
  BillingOrderItem,
  CartItemCustomized,
  CartItemInStock,
  OrderItemCustomized,
  OrderItemGiftCard,
  OrderItemInStock,
  Taxes,
} from '@couture-next/types';
import { BoxtalCarriers } from '@couture-next/shipping';
import { cartContainsCustomizedItems, firebaseServerImageLoader, removeTaxes } from '@couture-next/utils';
import { AdditionalDataForPayment } from './dto';
import { TRPCError } from '@trpc/server';
import { getSettingValue } from '../settings/getValue';

type ContextWithCart = Context & { cart: Cart; user: User };

type AdditionalData = Omit<AdditionalDataForPayment, 'promotionCode'> & {
  promotionCode: PromotionCode | null;
  paymentMethod: Order['billing']['paymentMethod'];
};

export const convertCartToNewOrder = async (
  ctx: ContextWithCart,
  additionalPayload: AdditionalData
): Promise<Omit<Prisma.OrderCreateInput, 'status'>> => {
  const { shipping, billing } = additionalPayload;

  const { cart } = ctx;

  const taxes = { ...cart.taxes };
  let subTotalTaxExcluded = cart.totalTaxExcluded;
  let subTotalTaxIncluded = cart.totalTaxIncluded;

  const getShippingCostPromise =
    shipping.method === 'pickup-at-workshop' || shipping.method === 'do-not-ship'
      ? Promise.resolve({
          taxInclusive: 0,
          taxExclusive: 0,
        })
      : ctx.boxtal
          .getPrice({
            carrier: shipping.method === 'colissimo' ? BoxtalCarriers.COLISSIMO : BoxtalCarriers.MONDIAL_RELAY,
            weight: cart.totalWeight,
          })
          .catch((e) => {
            console.error('Failed to fetch prices!', e);
            throw new Error('Error while fetching shipping cost');
          });

  const getManufacturingTimePromise = ctx.cms.getManufacturingTimes().then((res) => ({
    min: res.min,
    max: res.max,
    unit: res.unit.toUpperCase() as Uppercase<(typeof res)['unit']>,
  }));

  const getOffersPromise = ctx.cms.getOffers();

  const articleIds = cart.items.map((item) => item.articleId).filter((id): id is string => !!id);
  const allArticlesPromises = articleIds.length
    ? ctx.orm.article
        .findMany({
          where: {
            id: {
              in: articleIds,
            },
          },
        })
        .then((res) => res as Article[])
    : Promise.resolve([]);

  const getReferencePromise = ctx.orm.order
    .aggregate({
      _max: {
        reference: true,
      },
    })
    .then((res) => (res._max.reference ?? 0) + 1);

  // TODO
  // const getValidatedGiftCardsPromise = Promise.resolve([] as GiftCard[]);

  const customizableFabricIds = Array.from(
    new Set(
      cart.items
        .map((item) => {
          console.log(item.customizations);
          return item.type === 'giftCard'
            ? []
            : Object.values(item.customizations)
                .filter((c): c is typeof c & { type: 'fabric'; value: string } => c.type === 'fabric')
                .map((c) => c.value);
        })
        .flat()
    )
  );

  console.log('customizableFabricIds', customizableFabricIds);
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
    console.log('prefetched fabrics', r);
    return r;
  });

  const [
    shippingCost,
    manufacturingTimes,
    offers,
    allArticles,
    reference,
    // validatedGiftCards,
    chosenFabrics,
  ] = await Promise.all([
    getShippingCostPromise,
    getManufacturingTimePromise,
    getOffersPromise,
    allArticlesPromises,
    getReferencePromise,
    // getValidatedGiftCardsPromise,
    prefetchChosenFabrics,
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
      taxes[tax] *= 1 - promotionCodeDiscountRate;
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
    taxes[Taxes.VAT_20] += 15 - removeTaxes(15);
  }

  // Apply shipping costs
  const offerFreeShipping =
    // promotion code
    additionalPayload.promotionCode?.type === 'FREE_SHIPPING' ||
    // free shipping for md relay after threshold
    (offers.freeShippingThreshold !== null &&
      subTotalTaxIncludedWithOutGiftCardItems >= offers.freeShippingThreshold &&
      shipping.method === 'mondial-relay');

  if (!offerFreeShipping) {
    totalTaxExcluded += shippingCost.taxExclusive;
    totalTaxIncluded += shippingCost.taxInclusive;
    taxes[Taxes.VAT_20] += shippingCost.taxInclusive - shippingCost.taxExclusive;
  }

  // Append gift if order is eligible
  const addGiftToOrder =
    offers.giftThreshold !== null && subTotalTaxIncludedWithOutGiftCardItems >= offers.giftThreshold;

  // Round to two decimals
  totalTaxExcluded = roundToTwoDecimals(totalTaxExcluded);
  totalTaxIncluded = roundToTwoDecimals(totalTaxIncluded);
  subTotalTaxExcluded = roundToTwoDecimals(subTotalTaxExcluded);
  subTotalTaxIncluded = roundToTwoDecimals(subTotalTaxIncluded);
  shippingCost.taxExclusive = roundToTwoDecimals(shippingCost.taxExclusive);
  shippingCost.taxInclusive = roundToTwoDecimals(shippingCost.taxInclusive);
  Object.entries(taxes).forEach(([tax, value]) => {
    taxes[tax] = roundToTwoDecimals(value);
  });
  Object.values(orderExtras).forEach((extra) => {
    if (!extra) return;
    extra.priceTaxExcluded = roundToTwoDecimals(extra.priceTaxExcluded);
    extra.priceTaxIncluded = roundToTwoDecimals(extra.priceTaxIncluded);
  });

  // Deduct gift cards
  let totalPaidByGiftCards = 0;
  let amountByGiftCards = {} as Record<string, number>;
  //   giftCards.forEach((giftCard) => {
  //     const remaining = Math.max(0, totalTaxIncluded - totalPaidByGiftCards);
  //     const amount = Math.min(giftCard.amount - giftCard.consumedAmount, remaining);
  //     totalPaidByGiftCards += amount;
  //     amountByGiftCards[giftCard.id] = amount;
  //   });
  // TODO
  // WARNING, gift cards are not updated until the order is no longer a draft

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
      price: {
        taxExcluded: offerFreeShipping ? 0 : shippingCost.taxExclusive,
        taxIncluded: offerFreeShipping ? 0 : shippingCost.taxInclusive,
        originalTaxExcluded: shippingCost.taxExclusive,
        originalTaxIncluded: shippingCost.taxInclusive,
      } satisfies PrismaJson.OrderShipping['price'],
    } as PrismaJson.OrderShipping,
    billing: {
      ...billing,
      paymentMethod: additionalPayload.paymentMethod,
      giftCards: amountByGiftCards,
      amountPaidWithGiftCards: totalPaidByGiftCards,
    },
    items: cart.items.map((cartItem) => {
      const commonProps = {
        weight: cartItem.totalWeight,
        description: cartItem.description,
        image: cartItem.image,
        quantity: cartItem.quantity,
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
          customizations: cartItemToOrderItemCustomizations(cartItem, allArticles, chosenFabrics),
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
            allArticles,
            chosenFabrics
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
  allArticles: Article[],
  fabrics: Record<string, Fabric>
): OrderItemCustomized['customizations'] | OrderItemInStock['customizations'] {
  return Object.entries(cartItem.customizations ?? {}).map(([customzableId, { value: unknown }]) => {
    const article = allArticles.find((article) => article.id === cartItem.articleId);
    if (!article) throw new Error('Article not found');
    const customzable = article.customizables.find((customizable) => customizable.uid === customzableId);
    if (!customzable) throw new Error('Customizable not found');

    if (customzable.type === 'customizable-text') {
      return {
        title: customzable.label,
        value: unknown as string,
        type: 'text',
      };
    } else if (customzable.type === 'customizable-boolean') {
      return {
        title: customzable.label,
        value: (unknown as boolean) ? 'Oui' : 'Non',
        type: 'boolean',
      };
    } else if (customzable.type === 'customizable-part') {
      const fabric = fabrics[unknown as string];
      if (!fabric) throw new Error('Fabric not found');
      return {
        title: customzable.label,
        value: fabric.name,
        type: 'fabric',
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
  order: Pick<Order | Prisma.OrderCreateInput, 'giftOffered' | 'shipping' | 'extras' | 'items'>
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
  if (order.shipping.price.taxIncluded > 0) {
    r.push({
      label: 'Frais de port',
      price: Math.round(order.shipping.price.taxIncluded * 100),
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
  cart: Cart,
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
