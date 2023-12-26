import {
  CallPayByBankTransferPayload,
  CallPayByBankTransferResponse,
  NewWaitingBankTransferOrder,
} from '@couture-next/types';
import { onCall } from 'firebase-functions/v2/https';
import { cartToOrder, findCartWithLinkedDraftOrder, userInfosSchema } from './utils';
import { getFirestore } from 'firebase-admin/firestore';
import { adminFirestoreNewWaitingBankTransferOrder } from '@couture-next/utils';
import { BoxtalClient } from '@couture-next/shipping';
import { defineSecret } from 'firebase-functions/params';
import env from '../env';
import { getMailer } from '../mailer';

const boxtalUserSecret = defineSecret('BOXTAL_USER');
const boxtalPassSecret = defineSecret('BOXTAL_SECRET');

export const callPayByBankTransfer = onCall<unknown, Promise<CallPayByBankTransferResponse>>(
  { cors: '*', secrets: [boxtalPassSecret, boxtalUserSecret] },
  async (event) => {
    const userId = event.auth?.uid;
    const userEmail = event.auth?.token.email;
    if (!userId) throw new Error('No user id provided');
    if (!userEmail) throw new Error('No user email provided');

    const { cart, cartRef, draftOrder } = await findCartWithLinkedDraftOrder(userId);

    const { billing, shipping, extras } = userInfosSchema.parse(event.data) satisfies CallPayByBankTransferPayload;

    // TODO
    if (draftOrder) throw new Error('Payment process already began with an other method');

    const newOrder = await cartToOrder<NewWaitingBankTransferOrder>(
      new BoxtalClient(env.BOXTAL_API_URL, boxtalUserSecret.value(), boxtalPassSecret.value()),
      cart,
      userId,
      billing,
      shipping,
      extras,
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

    const mailer = getMailer();
    await mailer.scheduleSendEmail('bank-transfer-instructions', userEmail, {
      USER_FIRSTNAME: billing.firstName,
      USER_LASTNAME: billing.lastName,
      ORDER_TOTAL: newOrder.totalTaxIncluded.toFixed(2),
    });

    return newOrderRef.id;
  }
);
