import {
  BillingOrderItem,
  Cart,
  CallGetCartPaymentUrlResponse,
  DraftOrder,
  Article,
  Fabric,
  OrderItem,
  NewDraftOrder,
  CallGetCartPaymentUrlPayload,
} from '@couture-next/types';
import { getFirestore } from 'firebase-admin/firestore';
import { onCall } from 'firebase-functions/v2/https';
import { createStripeClient } from '@couture-next/billing';
import { defineSecret } from 'firebase-functions/params';
import { routes } from '@couture-next/routing';
import env from '../env';
import {
  adminFirestoreConverterAddRemoveId,
  adminFirestoreNewDraftOrderConverter,
  adminFirestoreOrderConverter,
} from '@couture-next/utils';

const stripeKeySecret = defineSecret('STRIPE_SECRET_KEY');

export const callGetCartPaymentUrl = onCall<
  unknown,
  Promise<CallGetCartPaymentUrlResponse>
>({ cors: '*', secrets: [stripeKeySecret] }, async (event) => {
  const userId = event.auth?.uid;
  const userEmail = event.auth?.token.email;
  if (!userId) throw new Error('No user id provided');
  if (!userEmail) throw new Error('No user email provided');

  const payload = parseAndValidate(event.data);

  const db = getFirestore();

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

  const existing = existingRef
    ? await existingRef.get().then<DraftOrder>((snapshot) => {
        if (!snapshot.exists) throw new Error('No draft order found');
        return snapshot.data() as DraftOrder;
      })
    : null;

  const stripeClient = createStripeClient(stripeKeySecret.value());

  if (existing && existing?.status !== 'draft')
    throw new Error('Payment already proceded');

  // If already exists and not expired
  if (
    existing &&
    !(await stripeClient.isProviderSessionExpired(
      existing.billing.checkoutSessionId
    ))
  ) {
    return existing.billing.checkoutSessionUrl;
  }

  const newDraftRef = db
    .collection('orders')
    .doc()
    .withConverter(adminFirestoreNewDraftOrderConverter);
  // Ref to existing or new draft
  const draftOrderRef = existingRef || newDraftRef;

  // Create new provider session
  const providerSession = await stripeClient.createProviderSession(
    draftOrderRef.id,
    userEmail,
    cartItemsToBillingOrderItems(cart),
    new URL(
      routes().cart().confirm(draftOrderRef.id),
      env.FRONTEND_BASE_URL
    ).toString()
  );

  if (!existingRef) {
    // Save new draft
    const newDraftOrderToSave = await cartToOrder(
      cart,
      userId,
      {
        ...payload.billing,
        checkoutSessionId: providerSession.sessionId,
        checkoutSessionUrl: providerSession.public_id,
      },
      payload.shipping
    );
    await db.runTransaction(async (transaction) => {
      transaction.set(
        cartRef,
        { draftOrderId: newDraftRef.id },
        { merge: true }
      );
      transaction.set(newDraftRef, newDraftOrderToSave);
      return;
    });
  } else {
    // Update existing draft
    await draftOrderRef.set(
      {
        billing: {
          checkoutSessionId: providerSession.sessionId,
          checkoutSessionUrl: providerSession.public_id,
        },
      },
      { merge: true }
    );
  }

  return providerSession.public_id;
});

function cartItemsToBillingOrderItems(cart: Cart): BillingOrderItem[] {
  return cart.items.map((item) => ({
    label: item.description,
    image: item.image,
    price: Math.round(item.totalTaxIncluded * 100),
    quantity: 1,
    quantity_unit: '',
  }));
}

async function cartToOrder(
  cart: Cart,
  userId: string,
  billing: NewDraftOrder['billing'],
  shipping: NewDraftOrder['shipping']
): Promise<NewDraftOrder> {
  const db = getFirestore();

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

  const fabrics = await prefetchChosenFabrics(cart, allArticles);

  return {
    status: 'draft',
    totalTaxExcluded: cart.totalTaxExcluded,
    totalTaxIncluded: cart.totalTaxIncluded,
    taxes: cart.taxes,
    items: cart.items.map((cartItem) => ({
      description: cartItem.description,
      image: cartItem.image,
      taxes: cartItem.taxes,
      totalTaxExcluded: cartItem.totalTaxExcluded,
      totalTaxIncluded: cartItem.totalTaxIncluded,
      customizations: Object.entries(cartItem.customizations).map(
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
          } satisfies OrderItem['customizations'][0];
        }
      ),
    })),
    user: {
      uid: userId,
      firstName: billing.firstName,
      lastName: billing.lastName,
    },
    billing,
    shipping,
  };
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
    Object.entries(cartItem.customizations).forEach(
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

function parseAndValidate(data: unknown): CallGetCartPaymentUrlPayload {
  if (!data) throw new Error('No data provided');
  if (typeof data !== 'object') throw new Error('Invalid data provided');
  const unknownBilling = (data as { billing: unknown })['billing'];
  if (!unknownBilling) throw new Error('No billing provided');
  const billing = parseAndValidateUserInfos(unknownBilling);
  const unknownShipping = (data as { shipping: unknown })['shipping'];
  if (!unknownShipping) throw new Error('No shipping provided');
  const shipping = parseAndValidateUserInfos(unknownShipping);
  const shippingMethod = (unknownShipping as { method: unknown })['method'];
  if (!shippingMethod) throw new Error('No shippingMethod provided');
  if (shippingMethod !== 'colissimo')
    throw new Error('Invalid shippingMethod provided');
  return {
    billing,
    shipping: {
      ...shipping,
      method: shippingMethod,
    },
  };
}

type UserInfos = {
  civility: 'M' | 'Mme';
  firstName: string;
  lastName: string;
  address: string;
  addressComplement: string;
  city: string;
  zipCode: string;
  country: string;
};

function parseAndValidateUserInfos(data: unknown): UserInfos {
  if (!data) throw new Error('No data provided');
  if (typeof data !== 'object') throw new Error('Invalid data provided');
  const civility = (data as { civility: unknown })['civility'];
  if (!civility) throw new Error('No civility provided');
  if (civility !== 'M' && civility !== 'Mme')
    throw new Error('Invalid civility provided');
  const firstName = (data as { firstName: unknown })['firstName'];
  if (!firstName) throw new Error('No firstName provided');
  if (typeof firstName !== 'string')
    throw new Error('Invalid firstName provided');
  const lastName = (data as { lastName: unknown })['lastName'];
  if (!lastName) throw new Error('No lastName provided');
  if (typeof lastName !== 'string')
    throw new Error('Invalid lastName provided');
  const address = (data as { address: unknown })['address'];
  if (!address) throw new Error('No address provided');
  if (typeof address !== 'string') throw new Error('Invalid address provided');
  const addressComplement = (
    data as {
      addressComplement: unknown;
    }
  )['addressComplement'];
  if (!addressComplement) throw new Error('No addressComplement provided');
  if (typeof addressComplement !== 'string')
    throw new Error('Invalid addressComplement provided');
  const city = (data as { city: unknown })['city'];
  if (!city) throw new Error('No city provided');
  if (typeof city !== 'string') throw new Error('Invalid city provided');
  const zipCode = (data as { zipCode: unknown })['zipCode'];
  if (!zipCode) throw new Error('No zipCode provided');
  if (typeof zipCode !== 'string') throw new Error('Invalid zipCode provided');
  const country = (data as { country: unknown })['country'];
  if (!country) throw new Error('No country provided');
  if (typeof country !== 'string') throw new Error('Invalid country provided');
  return {
    civility,
    firstName,
    lastName,
    address,
    addressComplement,
    city,
    zipCode,
    country,
  };
}
