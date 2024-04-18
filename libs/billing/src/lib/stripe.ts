import Stripe from 'stripe';
import type { BillingClient } from '@couture-next/types';
import type { Request } from 'express';

export function createStripeClient(stripeSecretKey: string, stripeWebhookSecret: string) {
  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2023-10-16',
  });

  const createProviderSession = (async (
    clientRef,
    customerEmail,
    orderItems,
    successUrl,
    totalDiscount,
    amountalreadyPaidByGiftCard
  ) => {
    let couponId: string | undefined;
    if (totalDiscount > 0) {
      const coupon = await stripe.coupons.create({
        amount_off: totalDiscount + amountalreadyPaidByGiftCard,
        duration: 'once',
        currency: 'eur',
        name:
          totalDiscount > 0 && amountalreadyPaidByGiftCard > 0
            ? 'Carte cadeau + réduction'
            : totalDiscount > 0
            ? 'Réduction'
            : 'Carte cadeau',
      });
      couponId = coupon.id;
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: successUrl,
      client_reference_id: clientRef,
      customer_email: customerEmail,
      line_items: orderItems.map((item) => ({
        price_data: {
          currency: 'eur',
          product_data: {
            name: item.label,
            images: item.image ? [item.image] : undefined,
            description: item.quantity_unit ? '1 quantité = ' + item.quantity_unit : undefined,
          },
          unit_amount: item.price,
        },
        quantity: item.quantity,
      })),
      discounts: couponId ? [{ coupon: couponId }] : undefined,
    });
    if (!session.url) throw new Error('Could not create order');

    return {
      sessionId: session.id,
      public_id: session.url,
      paymentId: session.payment_intent as string,
    };
  }) satisfies BillingClient['createProviderSession'];

  const cancelProviderSession = async (id: string) => {
    if (await isProviderSessionExpired(id)) return;
    await stripe.checkout.sessions.expire(id);
  };

  const isProviderSessionExpired = async (id: string) => {
    const session = await stripe.checkout.sessions.retrieve(id);
    return session.status === 'expired' || session.status === 'complete';
  };

  const extractEventFromRawBody = (rawBody: string, signature: string) => {
    return stripe.webhooks.constructEventAsync(rawBody, signature, stripeWebhookSecret);
  };

  return {
    ...({
      createProviderSession,
      cancelProviderSession,
      isProviderSessionExpired,
    } satisfies BillingClient),
    extractEventFromRawBody,
  };
}
