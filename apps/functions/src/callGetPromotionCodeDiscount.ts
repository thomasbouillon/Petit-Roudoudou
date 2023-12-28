import {
  CallGetPromotionCodeDiscountPayload,
  CallGetPromotionCodeDiscountResponse,
  Cart,
  PromotionCode,
} from '@couture-next/types';
import { adminFirestoreConverterAddRemoveId } from '@couture-next/utils';
import { firestore } from 'firebase-admin';
import { onCall } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { getPromotionCodeDiscount } from './utils';

const payloadSchema = z.object({
  code: z.string(),
  shippingCost: z.number(),
});

export const callGetPromotionCodeDiscount = onCall<unknown, Promise<CallGetPromotionCodeDiscountResponse>>(
  { cors: '*' },
  async (event) => {
    if (!event.auth) throw new Error('Unauthorized');

    const { code, shippingCost } = payloadSchema.parse(event.data) satisfies CallGetPromotionCodeDiscountPayload;

    const [promotionCodeSnapshot, cartSnapshot] = await Promise.all([
      firestore()
        .collection('promotionCodes')
        .withConverter(adminFirestoreConverterAddRemoveId<PromotionCode>())
        .where('code', '==', code)
        .get(),
      firestore().collection('carts').doc(event.auth.uid).get(),
    ]);
    if (promotionCodeSnapshot.empty) {
      throw new Error('Promotion code not found');
    }
    if (!cartSnapshot.exists) {
      throw new Error('Cart not found');
    }

    const promotionCode = promotionCodeSnapshot.docs[0].data();
    const cart = cartSnapshot.data()! as Cart;

    return {
      amount:
        promotionCode.type === 'freeShipping'
          ? shippingCost
          : getPromotionCodeDiscount(promotionCode, cart.totalTaxIncluded),
    };
  }
);
