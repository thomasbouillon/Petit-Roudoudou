import {
  BillingOrderItem,
  Cart,
  CallGetCartPaymentUrlResponse,
  DraftCheckoutSession,
  CheckoutSession,
} from '@couture-next/types';
import { getFirestore } from 'firebase-admin/firestore';
import { onCall } from 'firebase-functions/v2/https';
import { createStripeClient } from '@couture-next/billing';
import { defineSecret } from 'firebase-functions/params';
import { routes } from '@couture-next/routing';

const stripeKeySecret = defineSecret('STRIPE_SECRET_KEY');

export const callGetCartPaymentUrl = onCall<
  unknown,
  Promise<CallGetCartPaymentUrlResponse>
>({ cors: true, secrets: [stripeKeySecret] }, async (event) => {
  const userId = event.auth?.uid;
  const userEmail = event.auth?.token.email;
  if (!userId) throw new Error('No user id provided');
  if (!userEmail) throw new Error('No user id provided');

  const db = getFirestore();

  const checkoutSession = await db
    .collection('checkoutSessions')
    .doc(userId)
    .get()
    .then<CheckoutSession | undefined>((snapshot) => {
      return snapshot.data() as CheckoutSession | undefined;
    });

  const stripeClient = createStripeClient(stripeKeySecret.value());

  if (checkoutSession && checkoutSession?.type !== 'draft')
    throw new Error('Payment session already exists');

  if (
    checkoutSession &&
    !(await stripeClient.isProviderSessionExpired(checkoutSession.sessionId))
  ) {
    return checkoutSession.checkoutUrl;
  }

  const cart = await db
    .collection('carts')
    .doc(userId)
    .get()
    .then<Cart>((snapshot) => {
      if (!snapshot.exists) throw new Error('No cart found');
      return snapshot.data() as Cart;
    });

  const providerSession = await stripeClient.createProviderSession(
    userId,
    userEmail,
    cartItemsToBillingOrderItems(cart),
    new URL(routes().cart().confirm(), 'http://localhost:4200').toString()
  );

  const newcheckoutSession: DraftCheckoutSession = {
    checkoutUrl: providerSession.public_id,
    sessionId: providerSession.sessionId,
    paymentId: providerSession.paymentId,
    type: 'draft',
  };

  await db.collection('checkoutSessions').doc(userId).set(newcheckoutSession);

  return newcheckoutSession.checkoutUrl;
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
