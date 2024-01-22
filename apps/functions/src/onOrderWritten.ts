import { Article, Order, OrderItem, PromotionCode } from '@couture-next/types';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { getMailer } from './mailer';
import { routes } from '@couture-next/routing';
import env from './env';
import { getStorage } from 'firebase-admin/storage';
import { FieldPath, getFirestore } from 'firebase-admin/firestore';
import { adminFirestoreConverterAddRemoveId } from '@couture-next/utils';
import { deleteImageWithSizeVariants, getPublicUrl } from './utils';
import { getMessaging } from 'firebase-admin/messaging';

// Careful, do not update or delete order, this would create an infinite loop
export const onOrderWritten = onDocumentWritten('orders/{docId}', async (event) => {
  const snapshotBefore = event.data?.before;
  const prevData = snapshotBefore?.data() as Omit<Order, '_id'> | undefined;
  const snapshotAfter = event.data?.after;
  const nextData = snapshotAfter?.data() as Omit<Order, '_id'> | undefined;

  // Update article stocks
  if (
    (prevData?.status === undefined && nextData?.status === 'waitingBankTransfer') ||
    (prevData?.status === 'draft' && nextData?.status === 'paid')
  ) {
    const firestore = getFirestore();
    const articlesSnapshot =
      nextData.items.length > 0
        ? await firestore
            .collection('articles')
            .withConverter(adminFirestoreConverterAddRemoveId<Article>())
            .where(
              FieldPath.documentId(),
              'in',
              nextData.items.map((item) => item.articleId)
            )
            .get()
        : { docs: [] };

    console.info('New order, updating article stocks');

    await Promise.all(
      articlesSnapshot.docs.map(async (snap) => {
        const nextArticleStocks = [...snap.data().stocks];
        let stocksUpdated = false;
        nextArticleStocks.forEach((stock) => {
          nextData.items.forEach((item) => {
            if (stock.uid === item.originalStockId) {
              stock.stock = Math.max(stock.stock - item.quantity, 0);
              stocksUpdated = true;
            }
          });
        });
        if (stocksUpdated) {
          console.log('Updated article (_id=' + snap.id + ') stocks');
          await snap.ref.set({ stocks: nextArticleStocks }, { merge: true });
        }
      })
    );
  }

  // STATUS UPDATED, SEND EMAILS
  if (prevData?.status === 'waitingBankTransfer' && nextData?.status === 'paid' && snapshotAfter) {
    // Order payment validated
    const mailer = getMailer();
    const orderHref = new URL(routes().account().orders().order(snapshotAfter.id), env.FRONTEND_BASE_URL).toString();
    await mailer.scheduleSendEmail(
      'bank-transfer-received',
      {
        email: nextData.user.email,
        firstname: nextData.user.firstName,
        lastname: nextData.user.lastName,
      },
      {
        ORDER_HREF: orderHref,
      }
    );
  } else if (prevData?.status === 'draft' && nextData?.status === 'paid' && snapshotAfter) {
    // Order paid by card
    if (nextData.promotionCode) {
      await incrementPromotionCodeCounter(nextData.promotionCode.code);
    }

    const mailer = getMailer();
    const orderHref = new URL(routes().account().orders().order(snapshotAfter.id), env.FRONTEND_BASE_URL).toString();
    await mailer.scheduleSendEmail(
      'card-payment-received',
      {
        email: nextData.user.email,
        firstname: nextData.user.firstName,
        lastname: nextData.user.lastName,
      },
      {
        ORDER_HREF: orderHref,
      }
    );
    await mailer.scheduleSendEmail('admin-new-order', env.ADMIN_EMAIL, { ORDER_HREF: orderHref });
  } else if (prevData?.status === undefined && nextData?.status === 'waitingBankTransfer') {
    // New order with bank transfer
    if (nextData.promotionCode) {
      await incrementPromotionCodeCounter(nextData.promotionCode.code);
    }

    const mailer = getMailer();
    await Promise.all([
      mailer.scheduleSendEmail(
        'bank-transfer-instructions',
        {
          email: nextData.user.email,
          firstname: nextData.user.firstName,
          lastname: nextData.user.lastName,
        },
        {
          ORDER_TOTAL: nextData.totalTaxIncluded.toFixed(2),
        }
      ),
      mailer.scheduleSendEmail('admin-new-order', env.ADMIN_EMAIL, {
        ORDER_HREF: new URL(
          routes().admin().orders().order(snapshotAfter!.id).show(),
          env.FRONTEND_BASE_URL
        ).toString(),
      }),
      getFirestore()
        .collection('webPushTokens')
        .limit(100)
        .get()
        .then((snapshot) => {
          const tokens = snapshot.docs.map((doc) => doc.data().token);
          const messaging = getMessaging();
          return messaging.sendEach(
            tokens.map((token) => ({
              token,
              notification: {
                title: 'Nouvelle commande',
                body: `Une nouvelle commande de ${nextData.totalTaxIncluded.toFixed(2)}€ a été passée.`,
              },
            }))
          );
        })
        .catch((err) => {
          console.error('Failed to send web push notifications', err);
        }),
    ]);
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
        await deleteImageWithSizeVariants(prevImagePath);
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
    await Promise.all(
      prevData.items.map(async (item) => {
        console.log('Removed image', item.image.uid);
        await deleteImageWithSizeVariants(item.image.uid);
      })
    );
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
