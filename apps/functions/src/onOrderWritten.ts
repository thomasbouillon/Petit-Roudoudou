import { Order, OrderItem, PromotionCode } from '@couture-next/types';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { getMailer } from './mailer';
import { defineSecret } from 'firebase-functions/params';
import { routes } from '@couture-next/routing';
import env from './env';
import { getStorage } from 'firebase-admin/storage';
import { getFirestore } from 'firebase-admin/firestore';
import { adminFirestoreConverterAddRemoveId } from '@couture-next/utils';
import { getPublicUrl } from './utils';
// import { getPublicUrl } from './utils';

const mailjetClientKey = defineSecret('MAILJET_CLIENT_KEY');
const mailjetClientSecret = defineSecret('MAILJET_CLIENT_SECRET');

// Careful, do not update or delete order, this would create an infinite loop
export const onOrderWritten = onDocumentWritten('orders/{docId}', async (event) => {
  const snapshotBefore = event.data?.before;
  const prevData = snapshotBefore?.data() as Omit<Order, '_id'> | undefined;
  const snapshotAfter = event.data?.after;
  const nextData = snapshotAfter?.data() as Omit<Order, '_id'> | undefined;

  // STATUS UPDATED, SEND EMAILS
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

  // STATUS UPDATED, MOVE IMAGES
  if (
    ((prevData?.status === 'draft' && nextData?.status === 'paid') ||
      (prevData?.status === undefined && nextData?.status === 'waitingBankTransfer')) &&
    snapshotAfter
  ) {
    // New order, move images from cart folder
    const storage = getStorage();
    const newImages = await Promise.all(
      nextData.items.map(async (item, i) => {
        if (!item.image.uid.startsWith('carts/' + nextData.user.uid + '/')) return item.image;
        const prevImagePath = item.image.uid;
        const nextImagePath = `orders/${snapshotAfter?.id}/${item.image.uid.split('/').pop()}`;
        const file = storage.bucket().file(prevImagePath);
        await file.move(nextImagePath);
        console.log('Moved image', prevImagePath, 'to', nextImagePath);
        return { ...item.image, uid: nextImagePath, url: getPublicUrl(nextImagePath) } satisfies OrderItem['image'];
      })
    );

    // save new images
    await snapshotAfter.ref.set(
      { items: nextData.items.map((item, i) => ({ ...item, image: newImages[i] })) },
      { merge: true }
    );
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
