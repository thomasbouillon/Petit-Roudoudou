import {
  Article,
  Cart,
  Fabric,
  NewDraftOrder,
  NewWaitingBankTransferOrder,
  Order,
  OrderItemCustomized,
} from '@couture-next/types';
import {
  adminFirestoreConverterAddRemoveId,
  adminFirestoreOrderConverter,
} from '@couture-next/utils';
import { DocumentReference, getFirestore } from 'firebase-admin/firestore';
import env from '../env';
import { z } from 'zod';
import { BoxtalCarriers, BoxtalClientContract } from '@couture-next/shipping';

export async function findCartWithLinkedDraftOrder(userId: string) {
  const db = getFirestore();

  // Find cart
  const cartRef = db.collection('carts').doc(userId);
  const cart = await cartRef.get().then<Cart>((snapshot) => {
    if (!snapshot.exists) throw new Error('No cart found');
    return snapshot.data() as Cart;
  });

  const existingRef = cart.draftOrderId
    ? db
      .collection('orders')
      .doc(cart.draftOrderId)
      .withConverter(adminFirestoreOrderConverter)
    : null;

  // If cart is linked to an order, fetch it
  const existing = existingRef
    ? await existingRef.get().then((snapshot) => {
      if (!snapshot.exists) throw new Error('No draft order found');
      return snapshot.data() as Order;
    })
    : null;

  // If already exists and not draft
  if (existing && existing?.status !== 'draft')
    throw new Error('Payment already proceded');

  return { cart, cartRef, draftOrder: existing, draftOrderRef: existingRef };
}

export async function saveOrderAndLinkToCart<
  T extends NewDraftOrder | NewWaitingBankTransferOrder
>(cartRef: DocumentReference, orderRef: DocumentReference<T>, order: T) {
  const db = getFirestore();

  await db.runTransaction(async (transaction) => {
    transaction.set(cartRef, { draftOrderId: orderRef.id }, { merge: true });
    transaction.set(orderRef, order);
    return;
  });
}

export async function cartToOrder<
  T extends NewDraftOrder | NewWaitingBankTransferOrder
>(
  client: BoxtalClientContract,
  cart: Cart,
  userId: string,
  billing: T['billing'],
  shipping: T['shipping'],
  status: T['status']
): Promise<T> {
  const db = getFirestore();
  const containsCustomized = cart.items.some(
    (cartItem) => cartItem.type === 'customized'
  );

  const getShippingCostPromise = client.getPrice({
    carrier: shipping.method === 'colissimo' ? BoxtalCarriers.COLISSIMO : BoxtalCarriers.MONDIAL_RELAY,
    weight: cart.totalWeight,
  })

  const getManufacturingTimesPromise =  containsCustomized ? fetch(env.CMS_BASE_URL + '/manufacturing_times')
  .then((res) => res.json())
  .then((json) => json.data) as Promise<
    NonNullable<NewDraftOrder['manufacturingTimes']>
  > : null;

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

  const [fabrics, manufacturingTimes, shippingCost] = await Promise.all([
    prefetchChosenFabrics(cart, allArticles),
    getManufacturingTimesPromise,
    getShippingCostPromise
  ]);

  return {
    status,
    manufacturingTimes,
    totalTaxExcluded: cart.totalTaxExcluded + shippingCost.taxExclusive,
    totalTaxIncluded: cart.totalTaxIncluded + shippingCost.taxInclusive,
    totalTaxExcludedWithoutShipping: cart.totalTaxExcluded,
    totalTaxIncludedWithoutShipping: cart.totalTaxIncluded,
    totalWeight: cart.totalWeight,
    taxes: cart.taxes,
    items: cart.items.map((cartItem) => ({
      description: cartItem.description,
      image: cartItem.image,
      taxes: cartItem.taxes,
      weight: cartItem.weight,
      totalTaxExcluded: cartItem.totalTaxExcluded,
      totalTaxIncluded: cartItem.totalTaxIncluded,
      ...(cartItem.type === 'customized'
        ? {
          type: 'customized',
          customizations: Object.entries(cartItem.customizations ?? {}).map(
            ([customzableId, unknown]) => {
              const article = allArticles.find(
                (article) => article._id === cartItem.articleId
              );
              if (!article) throw new Error('Article not found');
              const customzable = article.customizables.find(
                (customizable) => customizable.uid === customzableId
              );
              if (!customzable) throw new Error('Customizable not found');

              if (customzable.type !== 'customizable-part')
                throw new Error('Not handled yet');

              const fabric = fabrics[unknown as string];
              if (!fabric) throw new Error('Fabric not found');

              return {
                title: customzable.label,
                value: fabric.name,
              } satisfies OrderItemCustomized['customizations'][0];
            }
          ),
        }
        : { type: 'inStock' }),
    })),
    user: {
      uid: userId,
      firstName: billing.firstName,
      lastName: billing.lastName,
    },
    billing,
    shipping,
  } as T;
}

async function prefetchChosenFabrics(
  cart: Cart,
  allArticles: Article[]
): Promise<Record<string, Fabric>> {
  const db = getFirestore();

  const chosenFabricIds = cart.items.reduce((acc, cartItem) => {
    const article = allArticles.find(
      (article) => article._id === cartItem.articleId
    );
    if (!article) throw new Error('Article not found');
    Object.entries(cartItem.customizations ?? {}).forEach(
      ([customizableId, value]) => {
        const customizable = article.customizables.find(
          (customizable) => customizable.uid === customizableId
        );
        if (!customizable) throw new Error('Customizable not found');
        if (customizable.type === 'customizable-part') {
          acc.add(value as string);
        }
      }
    );
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
  shipping: z.intersection(
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
  )
});
