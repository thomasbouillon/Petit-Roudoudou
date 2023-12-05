import {
  CallPayByBankTransferPayload,
  CallPayByBankTransferResponse,
  NewWaitingBankTransferOrder,
} from '@couture-next/types';
import { onCall } from 'firebase-functions/v2/https';
import {
  cartToOrder,
  findCartWithLinkedDraftOrder,
  userInfosSchema,
} from './utils';
import { getFirestore } from 'firebase-admin/firestore';

export const callPayByBankTransfer = onCall<
  unknown,
  Promise<CallPayByBankTransferResponse>
>({ cors: '*' }, async (event) => {
  const userId = event.auth?.uid;
  const userEmail = event.auth?.token.email;
  if (!userId) throw new Error('No user id provided');
  if (!userEmail) throw new Error('No user email provided');

  const { cart, cartRef, draftOrder } = await findCartWithLinkedDraftOrder(userId);

  const { billing, shipping } = userInfosSchema.parse(
    event.data
  ) satisfies CallPayByBankTransferPayload;

  // TODO
  if (draftOrder)
    throw new Error('Payment process already began with an other method');

  const newOrder = await cartToOrder<NewWaitingBankTransferOrder>(
    cart,
    userId,
    billing,
    shipping,
    'waitingBankTransfer'
  );

  const newOrderRef = getFirestore().collection('orders').doc();

  await getFirestore().runTransaction(async (transaction) => {
    transaction.set(newOrderRef, newOrder);
    transaction.delete(cartRef);
  })

  return newOrderRef.id;
});
