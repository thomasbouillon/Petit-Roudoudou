import { Order, OrderItem, PromotionCode } from '@couture-next/types';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { getMailer } from './mailer';
import { defineSecret } from 'firebase-functions/params';
import { routes } from '@couture-next/routing';
import env from './env';
import { getStorage } from 'firebase-admin/storage';
import { getFirestore } from 'firebase-admin/firestore';
import { adminFirestoreConverterAddRemoveId } from '@couture-next/utils';
import * as wget from 'wget-improved';
import { v4 as uuid } from 'uuid';
import { getPublicUrl } from './utils';

const mailjetClientKey = defineSecret('MAILJET_CLIENT_KEY');
const mailjetClientSecret = defineSecret('MAILJET_CLIENT_SECRET');

// Careful, do not update or delete order, this would create an infinite loop
export const onOrderWritten = onDocumentWritten('orders/{docId}', async (event) => {
  const snapshotBefore = event.data?.before;
  const prevData = snapshotBefore?.data() as Omit<Order, '_id'> | undefined;
  const snapshotAfter = event.data?.after;
  const nextData = snapshotAfter?.data() as Omit<Order, '_id'> | undefined;

  // ORDER IMPORTED FROM Legacy website
  if (!prevData && nextData && snapshotAfter?.id.startsWith('legacy-')) {
    const storage = getStorage();

    const newImages = await Promise.all(
      nextData.items.map(async (item) => {
        console.debug('Downloading image on filesystem', item.image.uid);
        const originalExtension = item.image.uid.split('.').pop();
        const filepath = await downloadLegacyImage(item.image.uid);
        const uid = 'orders/' + snapshotAfter.id + '/' + uuid() + '.' + originalExtension;
        console.debug('Uploading image to storage', uid);
        await storage.bucket().upload(filepath, { destination: uid });
        return { uid, url: getPublicUrl(uid) } satisfies OrderItem['image'];
      }) ?? []
    );

    // update item images
    snapshotAfter.ref.set(
      { items: nextData.items.map((item, index) => ({ ...item, image: newImages[index] })) },
      { merge: true }
    );

    // ABORT AVERYTHING ELSE
    return;
  }

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
      if (!item.image.uid) return console.warn('Image uid is empty, skipping');
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

function downloadLegacyImage(uid: string) {
  if (!uid) throw 'uid is empty';
  const filepath = `/tmp/${uid}`;
  const request = wget.download(`https://www.petit-roudoudou.fr/images/articles/preview/${uid}`, filepath);
  return new Promise<string>((resolve, reject) => {
    request.on('error', reject);
    request.on('progress', (progress) => console.debug(`${uid} progress: ${Math.round(parseFloat(progress) * 100)}%`));
    request.on('end', () => resolve(filepath));
  });
}
