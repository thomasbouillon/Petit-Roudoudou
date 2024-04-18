import {
  CallPayByBankTransferPayload,
  CallPayByBankTransferResponse,
  NewWaitingBankTransferOrder,
  PromotionCode,
} from '@couture-next/types';
import { onCall } from 'firebase-functions/v2/https';
import { cartToOrder, findCartWithLinkedDraftOrder, userInfosSchema } from './utils';
import { getFirestore } from 'firebase-admin/firestore';
import { adminFirestoreNewWaitingBankTransferOrder, cartContainsCustomizedItems } from '@couture-next/utils';
import { BoxtalClient } from '@couture-next/shipping';
import { defineSecret } from 'firebase-functions/params';
import env from '../env';
import { trpc } from '../trpc';

const boxtalUserSecret = defineSecret('BOXTAL_USER');
const boxtalPassSecret = defineSecret('BOXTAL_SECRET');

export const callPayByBankTransfer = onCall<unknown, Promise<CallPayByBankTransferResponse>>(
  { cors: '*', secrets: [boxtalPassSecret, boxtalUserSecret] },
  async (event) => {
    const userId = event.auth?.uid;
    const userEmail = event.auth?.token.email;
    if (!userId) throw new Error('No user id provided');
    if (!userEmail) throw new Error('No user email provided');
    if (event.auth?.token.firebase.sign_in_provider === 'anonymous') throw new Error('User is anonymous');
    const db = getFirestore();

    const { cart, cartRef } = await findCartWithLinkedDraftOrder(userId);

    const payload = userInfosSchema.parse(event.data) satisfies CallPayByBankTransferPayload;

    // Check if admin disabled custom articles
    if (cartContainsCustomizedItems(cart)) {
      const allowNewOrdersWithCustomArticles = await trpc.settings.getValue.query('allowNewOrdersWithCustomArticles');

      if (!allowNewOrdersWithCustomArticles) {
        console.error('Setting allowNewOrdersWithCustomArticles not found');
        throw new Error('Customized articles not allowed for now, please use in stock articles only');
      }
    }

    // Check if admin disabled urgent orders
    if (payload.extras.reduceManufacturingTimes) {
      const allowNewOrdersWithReducedManufacturingTimes = await trpc.settings.getValue.query(
        'allowNewOrdersWithReducedManufacturingTimes'
      );

      if (!allowNewOrdersWithReducedManufacturingTimes) {
        payload.extras.reduceManufacturingTimes = false;
      }
    }

    // TODO when migrating orders
    // const promotionCodeSnapshot = payload.promotionCode
    //   ? await firestore().collection('promotionCodes').where('code', '==', payload.promotionCode).get()
    //   : undefined;

    // if (promotionCodeSnapshot?.empty === true) throw new Error('Promotion code not found');

    const promotionCode = undefined as PromotionCode | undefined; //promotionCodeSnapshot?.docs[0].data() as Omit<PromotionCode, '_id'> | undefined;

    // check if promotion code is suitable for this cart
    if (
      promotionCode &&
      ((promotionCode.conditions.usageLimit && promotionCode.conditions.usageLimit <= promotionCode.used) ||
        (promotionCode.conditions.until && promotionCode.conditions.until.getTime() < Date.now()) ||
        (promotionCode.conditions.minAmount !== undefined &&
          promotionCode.conditions.minAmount >
            cart.totalTaxIncluded + (payload.extras.reduceManufacturingTimes ? 15 : 0)))
    ) {
      console.warn('Promotion code is not suitable for this cart');
      throw new Error('Promotion code not found');
    }

    // if (draftOrderRef) {
    //   // Delete draft order if previously tried to pay by card
    //   await draftOrderRef.delete();
    // }

    const newOrder = await cartToOrder<NewWaitingBankTransferOrder>(
      new BoxtalClient(env.BOXTAL_API_URL, boxtalUserSecret.value(), boxtalPassSecret.value(), {
        ENABLE_VAT_PASS_THROUGH: env.ENABLE_VAT_PASS_THROUGH,
      }),
      cart,
      userId,
      payload.giftCards,
      payload.billing,
      payload.shipping,
      payload.extras,
      promotionCode,
      'waitingBankTransfer'
    );

    const newOrderRef = db.collection('orders').doc().withConverter(adminFirestoreNewWaitingBankTransferOrder);

    await db.runTransaction(async (transaction) => {
      transaction.set(newOrderRef, newOrder);
      transaction.delete(cartRef);
    });

    return newOrderRef.id;
  }
);
