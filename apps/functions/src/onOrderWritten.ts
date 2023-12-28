import { Order, PromotionCode } from '@couture-next/types';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { getMailer } from './mailer';
import { defineSecret } from 'firebase-functions/params';
import { routes } from '@couture-next/routing';
import env from './env';
import { getStorage } from 'firebase-admin/storage';
import { getFirestore } from 'firebase-admin/firestore';
import { adminFirestoreConverterAddRemoveId } from '@couture-next/utils';

const mailjetClientKey = defineSecret('MAILJET_CLIENT_KEY');
const mailjetClientSecret = defineSecret('MAILJET_CLIENT_SECRET');

// Careful, do not update or delete order, this would create an infinite loop
export const onOrderWritten = onDocumentWritten('orders/{docId}', async (event) => {
  const snapshotBefore = event.data?.before;
  const prevData = snapshotBefore?.data() as Omit<Order, '_id'> | undefined;
  const snapshotAfter = event.data?.after;
  const nextData = snapshotAfter?.data() as Omit<Order, '_id'> | undefined;

  // STATUS UPDATED
  if (prevData?.status === 'waitingBankTransfer' && nextData?.status === 'paid' && snapshotAfter) {
    // Order payment validated
    const mailer = getMailer(mailjetClientKey.value(), mailjetClientSecret.value());
    const orderHref = new URL(routes().account().orders().order(snapshotAfter.id), env.FRONTEND_BASE_URL).toString();
    await mailer.scheduleSendEmail('bank-transfer-received', nextData.user.email, {
      USER_FIRSTNAME: nextData.user.firstName,
      ORDER_HREF: orderHref,
    });
  } else if (prevData?.status === 'draft' && nextData?.status === 'paid' && snapshotAfter) {
    // Order paid by card
    if (nextData.promotionCode) {
      await incrementPromotionCodeCounter(nextData.promotionCode.code);
    }

    const mailer = getMailer(mailjetClientKey.value(), mailjetClientSecret.value());
    const orderHref = new URL(routes().account().orders().order(snapshotAfter.id), env.FRONTEND_BASE_URL).toString();
    await mailer.scheduleSendEmail('card-payment-received', nextData.user.email, {
      USER_FIRSTNAME: nextData.user.firstName,
      ORDER_HREF: orderHref,
    });
    await mailer.scheduleSendEmail('admin-new-order', env.ADMIN_EMAIL, { ORDER_HREF: orderHref });
  } else if (prevData?.status === undefined && nextData?.status === 'waitingBankTransfer') {
    // New order with bank transfer
    if (nextData.promotionCode) {
      await incrementPromotionCodeCounter(nextData.promotionCode.code);
    }
  }

  // ORDER DELETED
  if (prevData && !nextData) {
    const storage = getStorage();
    prevData.items.map(async (item) => {
      console.log('Removed image', item.image.uid);
      const file = storage.bucket().file(item.image.uid);
      if (await file.exists().then((res) => res[0])) await file.delete();
    });
  }
});

async function incrementPromotionCodeCounter(code: string) {
  const firestore = getFirestore();
  const promotionCodeSnapshot = await firestore
    .collection('promotionCodes')
    .withConverter(adminFirestoreConverterAddRemoveId<PromotionCode>())
    .where('code', '==', code)
    .get();
  if (promotionCodeSnapshot.empty) return console.warn('Promotion code not found');

  const snapshot = promotionCodeSnapshot.docs[0];
  snapshot.ref.set({ used: snapshot.data().used + 1 }, { merge: true });
}
