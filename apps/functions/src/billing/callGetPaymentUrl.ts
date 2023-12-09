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
import { BoxtalClient } from '@couture-next/shipping';

const stripeKeySecret = defineSecret('STRIPE_SECRET_KEY');
const boxtalUserSecret = defineSecret('BOXTAL_USER');
const boxtalPassSecret = defineSecret('BOXTAL_SECRET');

export const callGetCartPaymentUrl = onCall<
  unknown,
  Promise<CallGetCartPaymentUrlResponse>
>({ cors: '*', secrets: [stripeKeySecret, boxtalUserSecret, boxtalPassSecret] }, async (event) => {
  const userId = event.auth?.uid;
  const userEmail = event.auth?.token.email;
  if (!userId) throw new Error('No user id provided');
  if (!userEmail) throw new Error('No user email provided');

  const payload = userInfosSchema.parse(
    event.data
  ) satisfies CallGetCartPaymentUrlPayload;

  let {
    cart,
    cartRef,
    draftOrder: existing,
    draftOrderRef: existingRef,
  } = await findCartWithLinkedDraftOrder(userId);

  const db = getFirestore();

  // If edited shipping (so new draft)
  if (existingRef && existing && (JSON.stringify(existing.shipping) !== JSON.stringify(payload.shipping))) {
    await existingRef.delete()
    existingRef = null
    existing = null 
  }

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

  // Get existing or create new not persisted draft
  const order = existing ? existing : await cartToOrder<NewDraftOrder>(
    new BoxtalClient(
      env.BOXTAL_API_URL,
      boxtalUserSecret.value(),
      boxtalPassSecret.value()
    ),
    cart,
    userId,
    {
      ...payload.billing,
      checkoutSessionId: 'IS_SET_LATER',
      checkoutSessionUrl: 'IS_SET_LATER',
    },
    payload.shipping,
    'draft'
  );

  // Create new provider session
  const providerSession = await stripeClient.createProviderSession(
    draftOrderRef.id,
    userEmail,
    [...cartItemsToBillingOrderItems(cart), {
      label: 'Frais de port',
      price: Math.round((order.totalTaxIncluded - order.totalTaxIncludedWithoutShipping) * 100),
      quantity: 1,
      quantity_unit: '',
    }],
    new URL(
      routes().cart().confirm(draftOrderRef.id),
      env.FRONTEND_BASE_URL
    ).toString()
  );

  if (!existingRef) {
    // Save new draft
    order.billing.checkoutSessionId = providerSession.sessionId;
    order.billing.checkoutSessionUrl = providerSession.public_id;
    await saveOrderAndLinkToCart(cartRef, newDraftRef, order as NewDraftOrder);
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
