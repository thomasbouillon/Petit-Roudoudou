import {
  Article,
  Cart,
  Extras,
  Fabric,
  NewDraftOrder,
  NewWaitingBankTransferOrder,
  Order,
  OrderItem,
  Taxes,
} from '@couture-next/types';
import { adminFirestoreConverterAddRemoveId, adminFirestoreOrderConverter, removeTaxes } from '@couture-next/utils';
import { DocumentReference, getFirestore } from 'firebase-admin/firestore';
import env from '../env';
import { z } from 'zod';
import { BoxtalCarriers, BoxtalClientContract } from '@couture-next/shipping';
import { getPromotionCodeDiscount } from '../utils';
import { getAuth } from 'firebase-admin/auth';

type CmsOffers = {
  freeShippingThreshold: number | null;
  giftThreshold: number | null;
};

export async function findCartWithLinkedDraftOrder(userId: string) {
  const db = getFirestore();

  // Find cart
  const cartRef = db.collection('carts').doc(userId);
  const cart = await cartRef.get().then<Cart>((snapshot) => {
    if (!snapshot.exists) throw new Error('No cart found');
    return snapshot.data() as Cart;
  });

  const existingRef = cart.draftOrderId
    ? db.collection('orders').doc(cart.draftOrderId).withConverter(adminFirestoreOrderConverter)
    : null;

  // If cart is linked to an order, fetch it
  const existing = existingRef
    ? await existingRef.get().then((snapshot) => {
        if (!snapshot.exists) throw new Error('No draft order found');
        return snapshot.data() as Order;
      })
    : null;

  // If already exists and not draft
  if (existing && existing?.status !== 'draft') throw new Error('Payment already proceded');

  return { cart, cartRef, draftOrder: existing, draftOrderRef: existingRef };
}

export async function saveOrderAndLinkToCart<T extends NewDraftOrder | NewWaitingBankTransferOrder>(
  cartRef: DocumentReference,
  orderRef: DocumentReference<T>,
  order: T
) {
  const db = getFirestore();

  await db.runTransaction(async (transaction) => {
    transaction.set(cartRef, { draftOrderId: orderRef.id }, { merge: true });
    transaction.set(orderRef, order);
    return;
  });
}

export async function cartToOrder<T extends NewDraftOrder | NewWaitingBankTransferOrder>(
  client: BoxtalClientContract,
  cart: Cart,
  userId: string,
  billing: T['billing'],
  shipping: Omit<T['shipping'], 'price'>,
  extras: Extras,
  promotionCode: T['promotionCode'],
  status: T['status']
): Promise<T> {
  const taxes = { ...cart.taxes };
  let subTotalTaxExcluded = cart.totalTaxExcluded;
  let subTotalTaxIncluded = cart.totalTaxIncluded;

  const db = getFirestore();
  const containsCustomized = cart.items.some((cartItem) => cartItem.type === 'customized');

  const getShippingCostPromise =
    shipping.method === 'pickup-at-workshop'
      ? Promise.resolve({
          taxInclusive: 0,
          taxExclusive: 0,
        })
      : client
          .getPrice({
            carrier: shipping.method === 'colissimo' ? BoxtalCarriers.COLISSIMO : BoxtalCarriers.MONDIAL_RELAY,
            weight: cart.totalWeight,
          })
          .catch((e) => {
            console.error('Failed to fetch prices!', e);
            throw new Error('Error while fetching shipping cost');
          });

  const getManufacturingTimesPromise = containsCustomized
    ? (fetch(env.CMS_BASE_URL + '/manufacturing_times')
        .then((res) => res.json())
        .then((json) => json.data) as Promise<NonNullable<NewDraftOrder['manufacturingTimes']>>)
    : null;

  const getOffersFromCmsPromise = fetch(env.CMS_BASE_URL + '/offers')
    .then((res) => res.json())
    .then((json) => json.data) as Promise<CmsOffers>;

  const allArticles = await Promise.all(
    cart.items.map(async (cartItem) => {
      const articleSnapshot = await db
        .doc(`articles/${cartItem.articleId}`)
        .withConverter(adminFirestoreConverterAddRemoveId<Article>())
        .get();
      if (!articleSnapshot.exists) throw new Error('Article not found');
      return articleSnapshot.data()!;
    })
  );

  const getReferencePromise = db
    .collection('orders')
    .orderBy('reference', 'desc')
    .limit(1)
    .get()
    .then((snapshot) => {
      const lastReference = snapshot.docs[0]?.data()?.reference;
      return lastReference ? lastReference + 1 : 1;
    });

  const [fabrics, manufacturingTimes, shippingCost, reference, offersFromCms] = await Promise.all([
    prefetchChosenFabrics(cart, allArticles),
    getManufacturingTimesPromise,
    getShippingCostPromise,
    getReferencePromise,
    getOffersFromCmsPromise,
  ]);

  // Apply promotion code to subTotal
  let promotionDiscountRate = 0;
  if (promotionCode) {
    promotionDiscountRate = getPromotionCodeDiscount(promotionCode, subTotalTaxIncluded) / subTotalTaxIncluded;
    subTotalTaxExcluded -= promotionDiscountRate * subTotalTaxExcluded;
    subTotalTaxIncluded -= promotionDiscountRate * subTotalTaxIncluded;
    Object.entries(taxes).forEach(([tax]) => {
      taxes[tax] *= 1 - promotionDiscountRate;
    });
  }

  // Apply extras
  let totalTaxExcluded = subTotalTaxExcluded;
  let totalTaxIncluded = subTotalTaxIncluded;

  const orderExtras: T['extras'] = {};
  if (extras.reduceManufacturingTimes) {
    orderExtras.reduceManufacturingTimes = {
      price: {
        priceTaxExcluded: removeTaxes(15),
        priceTaxIncluded: 15,
      },
    };
    totalTaxExcluded += removeTaxes(15);
    totalTaxIncluded += 15;
    taxes[Taxes.VAT_20] += 15 - removeTaxes(15);
  }

  // Apply shipping costs
  const offerFreeShipping =
    promotionCode?.type === 'freeShipping' ||
    (offersFromCms.freeShippingThreshold !== null && subTotalTaxIncluded >= offersFromCms.freeShippingThreshold);
  if (!offerFreeShipping) {
    totalTaxExcluded += shippingCost.taxExclusive;
    totalTaxIncluded += shippingCost.taxInclusive;
    taxes[Taxes.VAT_20] += shippingCost.taxInclusive - shippingCost.taxExclusive;
  }

  // Append gift if order is eligible
  const addGiftToOrder = offersFromCms.giftThreshold !== null && subTotalTaxIncluded >= offersFromCms.giftThreshold;

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
    extra.price.priceTaxExcluded = roundToTwoDecimals(extra.price.priceTaxExcluded);
    extra.price.priceTaxIncluded = roundToTwoDecimals(extra.price.priceTaxIncluded);
  });

  return {
    status,
    reference,
    manufacturingTimes,
    totalTaxExcluded,
    totalTaxIncluded,
    subTotalTaxExcluded,
    subTotalTaxIncluded,
    totalWeight: cart.totalWeight,
    taxes,
    extras: orderExtras,
    ...(promotionCode ? { promotionCode } : {}),
    items: cart.items.map((cartItem) => ({
      articleId: cartItem.articleId,
      description: cartItem.description,
      image: cartItem.image,
      taxes: Object.entries(cartItem.taxes).reduce((acc, [tax, value]) => {
        acc[tax] = roundToTwoDecimals(value * (1 - promotionDiscountRate));
        return acc;
      }, {} as Record<string, number>),
      weight: cartItem.totalWeight,
      quantity: cartItem.quantity,
      totalTaxExcluded: roundToTwoDecimals(cartItem.totalTaxExcluded * (1 - promotionDiscountRate)),
      totalTaxIncluded: roundToTwoDecimals(cartItem.totalTaxIncluded * (1 - promotionDiscountRate)),
      perUnitTaxExcluded: roundToTwoDecimals(cartItem.perUnitTaxExcluded * (1 - promotionDiscountRate)),
      perUnitTaxIncluded: roundToTwoDecimals(cartItem.perUnitTaxIncluded * (1 - promotionDiscountRate)),
      originalPerUnitTaxExcluded: roundToTwoDecimals(cartItem.perUnitTaxExcluded),
      originalPerUnitTaxIncluded: roundToTwoDecimals(cartItem.perUnitTaxIncluded),
      originalTotalTaxExcluded: roundToTwoDecimals(cartItem.totalTaxExcluded),
      originalTotalTaxIncluded: roundToTwoDecimals(cartItem.totalTaxIncluded),
      type: cartItem.type,
      ...(cartItem.type === 'inStock' ? { originalStockId: cartItem.stockUid } : {}),
      customizations: Object.entries(cartItem.customizations ?? {}).map(([customzableId, { value: unknown }]) => {
        const article = allArticles.find((article) => article._id === cartItem.articleId);
        if (!article) throw new Error('Article not found');
        const customzable = article.customizables.find((customizable) => customizable.uid === customzableId);
        if (!customzable) throw new Error('Customizable not found');

        if (customzable.type === 'customizable-text') {
          return {
            title: customzable.label,
            value: unknown as string,
            type: 'text',
          } satisfies OrderItem['customizations'][0];
        } else if (customzable.type === 'customizable-boolean') {
          return {
            title: customzable.label,
            value: (unknown as boolean) ? 'Oui' : 'Non',
            type: 'boolean',
          } satisfies OrderItem['customizations'][0];
        } else if (customzable.type === 'customizable-part') {
          const fabric = fabrics[unknown as string];
          if (!fabric) throw new Error('Fabric not found');
          return {
            title: customzable.label,
            value: fabric.name,
            type: 'fabric' as 'text',
          } satisfies OrderItem['customizations'][0];
        } else {
          throw new Error('Unknown customizable type');
        }
      }),
    })),
    user: {
      uid: userId,
      ...(await getDetailsFromUserId(userId)),
    },
    billing,
    shipping: {
      ...shipping,
      price: {
        taxExcluded: offerFreeShipping ? 0 : shippingCost.taxExclusive,
        taxIncluded: offerFreeShipping ? 0 : shippingCost.taxInclusive,
        originalTaxExcluded: shippingCost.taxExclusive,
        originalTaxIncluded: shippingCost.taxInclusive,
      },
    },
    giftOffered: addGiftToOrder,
  } as T;
}

async function getDetailsFromUserId(userId: string) {
  const auth = getAuth();
  const user = await auth.getUser(userId);
  return {
    firstName: user.displayName?.split(' ')[0] ?? '',
    lastName: user.displayName?.split(' ').slice(1).join(' ') ?? '',
    email: user.email ?? '',
  };
}

async function prefetchChosenFabrics(cart: Cart, allArticles: Article[]): Promise<Record<string, Fabric>> {
  const db = getFirestore();

  const chosenFabricIds = cart.items.reduce((acc, cartItem) => {
    const article = allArticles.find((article) => article._id === cartItem.articleId);
    if (!article) throw new Error('Article not found');
    Object.entries(cartItem.customizations ?? {}).forEach(([customizableId, { value }]) => {
      const customizable = article.customizables.find((customizable) => customizable.uid === customizableId);
      if (!customizable) throw new Error('Customizable not found');
      if (customizable.type === 'customizable-part') {
        acc.add(value as string);
      }
    });
    return acc;
  }, new Set<string>());

  const fabrics = await Promise.all(
    Array.from(chosenFabricIds).map(async (fabricId) => {
      const fabricSnapshot = await db
        .doc(`fabrics/${fabricId}`)
        .withConverter(adminFirestoreConverterAddRemoveId<Fabric>())
        .get();
      if (!fabricSnapshot.exists) throw new Error('Fabric not found');
      return fabricSnapshot.data()!;
    })
  );

  return fabrics.reduce((acc, fabric) => {
    acc[fabric._id] = fabric;
    return acc;
  }, {} as Record<string, Fabric>);
}

export const userInfosSchema = z.object({
  billing: z.object({
    civility: z.enum(['M', 'Mme']),
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
        civility: z.enum(['M', 'Mme']),
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
          method: z.literal('colissimo'),
        }),
        z.object({
          method: z.literal('mondial-relay'),
          relayPoint: z.object({
            code: z.string(),
          }),
        }),
      ])
    ),
    z.object({
      method: z.literal('pickup-at-workshop'),
    }),
  ]),
  extras: z.object({
    reduceManufacturingTimes: z.boolean(),
  }),
  promotionCode: z.string().optional(),
});

function roundToTwoDecimals(value: number) {
  return Math.round(value * 100) / 100;
}
