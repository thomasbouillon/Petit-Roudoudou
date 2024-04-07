import {
  CallGetPromotionCodeDiscountPayload,
  CallGetPromotionCodeDiscountResponse,
  Cart,
  PromotionCode,
} from '@couture-next/types';
import { adminFirestoreConverterAddRemoveId } from '@couture-next/utils';
import { firestore } from 'firebase-admin';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { getPromotionCodeDiscount } from './utils';

const payloadSchema = z.object({
  code: z.string(),
  shippingCost: z.number(),
  extras: z.object({
    reduceManufacturingTimes: z.boolean(),
  }),
});

export const callGetPromotionCodeDiscount = onCall<unknown, Promise<CallGetPromotionCodeDiscountResponse>>(
  { cors: '*' },
  async (event) => {
    if (!event.auth) throw new Error('Unauthorized');

    const { code, shippingCost, extras } = payloadSchema.parse(
      event.data
    ) satisfies CallGetPromotionCodeDiscountPayload;

    const [promotionCodeSnapshot, cartSnapshot] = await Promise.all([
      firestore()
        .collection('promotionCodes')
        .withConverter(adminFirestoreConverterAddRemoveId<PromotionCode>())
        .where('code', '==', code)
        .get(),
      firestore().collection('carts').doc(event.auth.uid).get(),
    ]);
    if (promotionCodeSnapshot.empty) {
      throw new HttpsError('not-found', 'Promotion code not found');
    }
    if (!cartSnapshot.exists) {
      throw new HttpsError('not-found', 'Cart not found');
    }

    const promotionCode = promotionCodeSnapshot.docs[0].data();
    const cart = cartSnapshot.data()! as Cart;

    if (
      (promotionCode.conditions.usageLimit && promotionCode.conditions.usageLimit <= promotionCode.used) ||
      (promotionCode.conditions.until && promotionCode.conditions.until.getTime() < Date.now()) ||
      (promotionCode.conditions.minAmount !== undefined &&
        promotionCode.conditions.minAmount > cart.totalTaxIncluded + (extras.reduceManufacturingTimes ? 15 : 0))
    ) {
      console.warn('Promotion code is not suitable for this cart');
      throw new HttpsError('not-found', 'Promotion code not found');
    }

    if (promotionCode.type === 'freeShipping' && shippingCost === 0) {
      throw new HttpsError('not-found', 'Promotion code not found');
    }

    const subTotalTaxIncludedWithOutGiftCardItems =
      cart.totalTaxIncluded -
      cart.items.reduce((acc, cartItem) => {
        if (cartItem.type === 'giftCard') {
          return acc + cartItem.totalTaxIncluded;
        }
        return acc;
      }, 0);

    return {
      amount:
        promotionCode.type === 'freeShipping'
          ? shippingCost
          : getPromotionCodeDiscount(promotionCode, subTotalTaxIncludedWithOutGiftCardItems),
    };
  }
);
