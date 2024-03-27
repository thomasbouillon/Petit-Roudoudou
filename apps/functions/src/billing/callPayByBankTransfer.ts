import {
  CallPayByBankTransferPayload,
  CallPayByBankTransferResponse,
  NewWaitingBankTransferOrder,
  PromotionCode,
} from '@couture-next/types';
import { onCall } from 'firebase-functions/v2/https';
import { cartToOrder, findCartWithLinkedDraftOrder, userInfosSchema } from './utils';
import { getFirestore } from 'firebase-admin/firestore';
import { adminFirestoreNewWaitingBankTransferOrder } from '@couture-next/utils';
import { BoxtalClient } from '@couture-next/shipping';
import { defineSecret } from 'firebase-functions/params';
import env from '../env';
import { firestore } from 'firebase-admin';

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

    const { cart, cartRef, draftOrder } = await findCartWithLinkedDraftOrder(userId);

    const {
      billing,
      shipping,
      extras,
      promotionCode: promotionCodeStr,
    } = userInfosSchema.parse(event.data) satisfies CallPayByBankTransferPayload;
    const promotionCodeSnapshot = promotionCodeStr
      ? await firestore().collection('promotionCodes').where('code', '==', promotionCodeStr).get()
      : undefined;

    if (promotionCodeSnapshot?.empty === true) throw new Error('Promotion code not found');

    const promotionCode = promotionCodeSnapshot?.docs[0].data() as Omit<PromotionCode, '_id'> | undefined;

    // check if promotion code is suitable for this cart
    if (
      promotionCode &&
      ((promotionCode.conditions.usageLimit && promotionCode.conditions.usageLimit <= promotionCode.used) ||
        (promotionCode.conditions.until && promotionCode.conditions.until.getTime() < Date.now()) ||
        (promotionCode.conditions.minAmount !== undefined &&
          promotionCode.conditions.minAmount > cart.totalTaxIncluded + (extras.reduceManufacturingTimes ? 15 : 0)))
    ) {
      console.warn('Promotion code is not suitable for this cart');
      throw new Error('Promotion code not found');
    }

    // TODO
    if (draftOrder) throw new Error('Payment process already began with an other method');

    const newOrder = await cartToOrder<NewWaitingBankTransferOrder>(
      new BoxtalClient(env.BOXTAL_API_URL, boxtalUserSecret.value(), boxtalPassSecret.value()),
      cart,
      userId,
      billing,
      shipping,
      extras,
      promotionCode,
      'waitingBankTransfer'
    );

    const newOrderRef = getFirestore()
      .collection('orders')
      .doc()
      .withConverter(adminFirestoreNewWaitingBankTransferOrder);

    await getFirestore().runTransaction(async (transaction) => {
      transaction.set(newOrderRef, newOrder);
      transaction.delete(cartRef);
    });

    return newOrderRef.id;
  }
);
