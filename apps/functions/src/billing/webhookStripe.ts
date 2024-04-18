import { Difference, DraftOrder, Order, PaidOrder } from '@couture-next/types';
import { adminFirestoreOrderConverter } from '@couture-next/utils';
import { getFirestore } from 'firebase-admin/firestore';
import { defineSecret } from 'firebase-functions/params';
import { onRequest } from 'firebase-functions/v2/https';
import { Stripe } from 'stripe';

const stripeWebhookSecret = defineSecret('STRIPE_WEBHOOK_SECRET');
const stripeKeySecret = defineSecret('STRIPE_SECRET_KEY');

export const webhookStripe = onRequest(
  {
    secrets: [stripeWebhookSecret, stripeKeySecret],
  },
  async (request, response) => {
    // Validate webhook signature
    const sig = request.headers['stripe-signature'] as string;
    const event = await parseAndVerifyEvent(request.rawBody, sig).catch((err) => {
      console.warn('[STRIPE WEBHOOK ERROR]', err);
    });
    if (!event) {
      response.status(400).send('Invalid event');
      return;
    }

    try {
      if (event.type === 'checkout.session.completed') await handleCheckoutSessionCompleted(event);
      else console.warn('[STRIPE WEBHOOK ERROR] Unhandled event type', event.type);
      response.status(200).send('OK');
    } catch (e: unknown) {
      if (
        typeof e === 'object' &&
        e !== null &&
        'message' in e &&
        'code' in e &&
        typeof e.message === 'string' &&
        typeof e.code === 'number'
      ) {
        console.warn('[STRIPE WEBHOOK ERROR]', e.message);
        response.status(e.code).send();
      } else {
        console.warn('[STRIPE WEBHOOK ERROR]', e);
        response.status(500).send('Unhandled error');
      }
    }
  }
);

async function parseAndVerifyEvent(payload: string | Buffer, sig: string) {
  const helper = new Stripe(stripeKeySecret.value()).webhooks;
  return await helper.constructEventAsync(payload, sig, stripeWebhookSecret.value());
}

async function handleCheckoutSessionCompleted(event: Stripe.CheckoutSessionCompletedEvent) {
  const providerSession = event.data.object;
  if (!providerSession.client_reference_id) throw { message: 'No client reference id', code: 400 };

  // Find corresponding draft cart
  const db = getFirestore();
  const orderRef = db
    .collection('orders')
    .doc(providerSession.client_reference_id)
    .withConverter(adminFirestoreOrderConverter);

  const snapshot = await orderRef.get().catch((e) => {
    console.warn('[STRIPE WEBHOOK ERROR]', e);
    throw { message: 'Error getting checkout session', code: 500 };
  });
  if (!snapshot.exists) {
    console.warn('[STRIPE WEBHOOK ERROR] Draft order does not exist', providerSession.client_reference_id);
    throw { message: 'Draft order not found', code: 404 };
  }

  const order = snapshot.data()!;
  if (order.status !== 'draft') {
    console.warn('[STRIPE WEBHOOK ERROR] Checkout session is not draft', providerSession.client_reference_id);
    throw { message: 'Checkout session is not pending', code: 400 };
  }

  // // Find related cart
  // const cartRef = db.collection('carts').doc((order as Order).user.uid);

  await db
    .runTransaction(async (transaction) => {
      // Update checkout session status to paid
      transaction.set(
        orderRef,
        {
          status: 'paid' as PaidOrder['status'],
          paidAt: new Date(),
          paymentMethod: 'card',
          workflowStep: 'in-production',
        } satisfies Difference<PaidOrder<'card'>, DraftOrder>,
        { merge: true }
      );

      // Update checkout session status to paid
      // transaction.delete(cartRef);
    })
    .catch((e) => {
      console.warn('[STRIPE WEBHOOK ERROR]', e);
      throw { message: 'Error updating order', code: 500 };
    });
}
