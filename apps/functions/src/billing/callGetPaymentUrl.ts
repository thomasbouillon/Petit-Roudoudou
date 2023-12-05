import {
  BillingOrderItem,
  Cart,
  CallGetCartPaymentUrlResponse,
  NewDraftOrder,
  CallGetCartPaymentUrlPayload,
} from '@couture-next/types';
import { getFirestore } from 'firebase-admin/firestore';
import { onCall } from 'firebase-functions/v2/https';
import { createStripeClient } from '@couture-next/billing';
import { defineSecret } from 'firebase-functions/params';
import { routes } from '@couture-next/routing';
import env from '../env';
import { adminFirestoreNewDraftOrderConverter } from '@couture-next/utils';
import { firebaseServerImageLoader } from '@couture-next/utils';
import {
  cartToOrder,
  findCartWithLinkedDraftOrder,
  saveOrderAndLinkToCart,
  userInfosSchema,
} from './utils';

const stripeKeySecret = defineSecret('STRIPE_SECRET_KEY');

export const callGetCartPaymentUrl = onCall<
  unknown,
  Promise<CallGetCartPaymentUrlResponse>
>({ cors: '*', secrets: [stripeKeySecret] }, async (event) => {
  const userId = event.auth?.uid;
  const userEmail = event.auth?.token.email;
  if (!userId) throw new Error('No user id provided');
  if (!userEmail) throw new Error('No user email provided');

  const payload = userInfosSchema.parse(
    event.data
  ) satisfies CallGetCartPaymentUrlPayload;

  const {
    cart,
    cartRef,
    draftOrder: existing,
    draftOrderRef: existingRef,
  } = await findCartWithLinkedDraftOrder(userId);

  const db = getFirestore();

  const stripeClient = createStripeClient(stripeKeySecret.value());

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
    const newDraftOrderToSave = await cartToOrder<NewDraftOrder>(
      cart,
      userId,
      {
        ...payload.billing,
        checkoutSessionId: providerSession.sessionId,
        checkoutSessionUrl: providerSession.public_id,
      },
      payload.shipping,
      'draft'
    );
    await saveOrderAndLinkToCart(cartRef, newDraftRef, newDraftOrderToSave);
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
    image: firebaseServerImageLoader({ src: item.image.url, width: 256 }),
    price: Math.round(item.totalTaxIncluded * 100),
    quantity: 1,
    quantity_unit: '',
  }));
}
