import Stripe from 'stripe';
import type { BillingClient } from '@couture-next/types';

export function createStripeClient(stripeSecretKey: string): BillingClient {
  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2023-10-16',
  });

  const createProviderSession = (async (
    clientRef,
    customerEmail,
    orderItems,
    successUrl
  ) => {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: successUrl,
      client_reference_id: clientRef,
      customer_email: customerEmail,
      payment_method_types: ['card'],
      line_items: orderItems.map((item) => ({
        price_data: {
          currency: 'eur',
          product_data: {
            name: item.label,
            images: [item.image],
            description: item.quantity_unit
              ? '1 quantité = ' + item.quantity_unit
              : undefined,
          },
          unit_amount: item.price,
        },
        quantity: item.quantity,
      })),
    });
    if (!session.url) throw new Error('Could not create order');

    return {
      sessionId: session.id,
      public_id: session.url,
      paymentId: session.payment_intent as string,
    };
  }) satisfies BillingClient['createProviderSession'];

  const cancelProviderSession = async (id: string) => {
    await stripe.checkout.sessions.expire(id);
  };

  const isProviderSessionExpired = async (id: string) => {
    const session = await stripe.checkout.sessions.retrieve(id);
    return session.status === 'expired' || session.status === 'complete';
  };

  return {
    createProviderSession,
    cancelProviderSession,
    isProviderSessionExpired,
  };
}
