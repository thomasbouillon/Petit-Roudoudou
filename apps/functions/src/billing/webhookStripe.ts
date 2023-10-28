import { CheckoutSession } from '@couture-next/types';
import { getFirestore } from 'firebase-admin/firestore';
import { defineSecret } from 'firebase-functions/params';
import { onRequest } from 'firebase-functions/v2/https';
import { Stripe } from 'stripe';

const stripeWebhookSecret = defineSecret('STRIPE_WEBHOOK_SECRET');
const stripeKeySecret = defineSecret('STRIPE_SECRET_KEY');

export const webhookStripe = onRequest(
  {
    cors: true,
    secrets: [stripeWebhookSecret, stripeKeySecret],
  },
  async (request, response) => {
    // Validate webhook signature
    const sig = request.headers['stripe-signature'] as string;
    const event = await parseAndVerifyEvent(request.rawBody, sig).catch(
      (err) => {
        console.warn('[STRIPE WEBHOOK ERROR]', err);
      }
    );
    if (!event) {
      response.status(400).send('Invalid event');
      return;
    }

    try {
      if (event.type === 'payment_intent.processing')
        await handlePaymentIntentIsProcessing(event);
      else if (event.type === 'checkout.session.completed')
        await handleCheckoutSessionCompleted(event);
      else
        console.warn('[STRIPE WEBHOOK ERROR] Unhandled event type', event.type);
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
        response.status(e.code).send(e.message);
      } else {
        console.warn('[STRIPE WEBHOOK ERROR]', e);
        response.status(500).send('Unhandled error');
      }
    }
  }
);

async function parseAndVerifyEvent(payload: string | Buffer, sig: string) {
  const helper = new Stripe(stripeKeySecret.value()).webhooks;
  return await helper.constructEventAsync(
    payload,
    sig,
    stripeWebhookSecret.value()
  );
}

async function handlePaymentIntentIsProcessing(
  event: Stripe.PaymentIntentProcessingEvent
) {
  const paymentIntent = event.data.object;

  const firestore = getFirestore();

  // Find checkout session
  const checkoutSessionsRef = firestore
    .collection('checkoutSessions')
    .where('paymentId', '==', paymentIntent.id);

  const snapshot = await checkoutSessionsRef.get().catch((e) => {
    console.warn('[STRIPE WEBHOOK ERROR]', e);
    throw { message: 'Error getting checkout session', code: 500 };
  });

  if (snapshot.empty) {
    console.warn(
      '[STRIPE WEBHOOK ERROR] Checkout session does not exist',
      paymentIntent.id
    );
    throw { message: 'Checkout session not found', code: 404 };
  }

  // Verify checkout session is draft
  const checkoutSessionSnapshot = snapshot.docs[0];
  const checkoutSession = checkoutSessionSnapshot.data() as CheckoutSession;

  if (checkoutSession.type !== 'draft') {
    console.warn(
      '[STRIPE WEBHOOK ERROR] Checkout session is not draft',
      paymentIntent.id
    );
    throw { message: 'Checkout session is not draft', code: 400 };
  }

  // set checkout session to pending
  await checkoutSessionSnapshot.ref
    .set({ type: 'pending' satisfies CheckoutSession['type'] }, { merge: true })
    .catch((e) => {
      console.warn('[STRIPE WEBHOOK ERROR]', e);
      throw {
        message: 'Error updating checkout session',
        code: 500,
      };
    });
}

async function handleCheckoutSessionCompleted(
  event: Stripe.CheckoutSessionCompletedEvent
) {
  const providerSession = event.data.object;
  if (!providerSession.client_reference_id)
    throw { message: 'No client reference id', code: 400 };

  // Find corresponding checkout session
  const db = getFirestore();
  const checkoutSessionRef = db
    .collection('checkoutSessions')
    .doc(providerSession.client_reference_id);

  const snapshot = await checkoutSessionRef.get().catch((e) => {
    console.warn('[STRIPE WEBHOOK ERROR]', e);
    throw { message: 'Error getting checkout session', code: 500 };
  });
  if (!snapshot.exists) {
    console.warn(
      '[STRIPE WEBHOOK ERROR] Checkout session does not exist',
      providerSession.client_reference_id
    );
    throw { message: 'Checkout session not found', code: 404 };
  }

  // Verify checkout session is pending
  const checkoutSession = snapshot.data() as CheckoutSession;
  if (checkoutSession.type !== 'pending' && checkoutSession.type !== 'draft') {
    console.warn(
      '[STRIPE WEBHOOK ERROR] Checkout session is neither draft nor pending',
      providerSession.client_reference_id
    );
    throw { message: 'Checkout session is not pending', code: 400 };
  }

  // Update checkout session status to paid
  await checkoutSessionRef
    .set(
      {
        type: 'paid' satisfies CheckoutSession['type'],
      },
      { merge: true }
    )
    .catch((e) => {
      console.warn('[STRIPE WEBHOOK ERROR]', e);
      throw { message: 'Error updating checkout session', code: 500 };
    });
}
