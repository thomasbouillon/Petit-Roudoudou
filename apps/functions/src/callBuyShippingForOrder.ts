import { BoxtalCarriers, BoxtalClient } from '@couture-next/shipping';
import { CallBuyShippingForOrderResponse } from '@couture-next/types';
import { adminFirestoreOrderConverter } from '@couture-next/utils';
import { getFirestore } from 'firebase-admin/firestore';
import { onCall } from 'firebase-functions/v2/https';
import { z } from 'zod';
import env from './env';
import { defineSecret } from 'firebase-functions/params';

const boxtalUserSecret = defineSecret('BOXTAL_USER');
const boxtalPassSecret = defineSecret('BOXTAL_SECRET');

export const callBuyShippingForOrder = onCall<unknown, Promise<CallBuyShippingForOrderResponse>>(
  { cors: '*' },
  async (event) => {
    if (!event.auth) throw new Error('Unauthorized');
    if (!event.auth.token.admin) throw new Error('Unauthorized');

    const { orderId } = z
      .object({
        orderId: z.string(),
      })
      .parse(event.data);

    const orderRef = getFirestore().collection('orders').doc(orderId).withConverter(adminFirestoreOrderConverter);
    const orderSnapshot = await orderRef.get();

    const order = orderSnapshot.data()!;

    if (order.status !== 'paid') {
      throw new Error('Order is not paid');
    }

    if (order.shipping.method === 'pickup-at-workshop') {
      throw new Error('Order is pickup at workshop');
    }

    if (order.shipping.boxtalReference) {
      throw new Error('Order already has a Boxtal reference');
    }

    const carrier: BoxtalCarriers | null =
      order.shipping.method === 'colissimo'
        ? BoxtalCarriers.COLISSIMO
        : order.shipping.method === 'mondial-relay'
        ? BoxtalCarriers.MONDIAL_RELAY
        : null;

    if (!carrier) {
      throw new Error('Order shipping method is invalid');
    }

    console.log('Buying shipping...');
    const boxtal = new BoxtalClient(env.BOXTAL_API_URL, boxtalUserSecret.value(), boxtalPassSecret.value());
    const res = await boxtal.buyShipping({
      internalReference: order._id,
      carrier,
      address: {
        firstName: order.shipping.firstName,
        lastName: order.shipping.lastName,
        address: order.shipping.address,
        addressComplement: order.shipping.addressComplement,
        zipCode: order.shipping.zipCode,
        city: order.shipping.city,
        country: order.shipping.country,
      },
      contentDescription: order.items.map((item) => item.description).join('; '),
      user: {
        email: order.user.email,
        phone: '+33695495077',
      },
      webhookUrl: '#',
      weight: order.totalWeight,
      pickupPointCode: order.shipping.method === 'mondial-relay' ? order.shipping.relayPoint.code : undefined,
    });

    await orderRef.set(
      {
        shipping: {
          boxtalReference: res.boxtalReference,
          pricePaidByUs: {
            taxExcluded: res.taxExclusive,
            taxIncluded: res.taxInclusive,
          },
          boxtalInstructions: res.boxtalComments,
          estimatedDeliveryDate: res.estimatedDeliveryDate,
        },
      },
      { merge: true }
    );
  }
);
