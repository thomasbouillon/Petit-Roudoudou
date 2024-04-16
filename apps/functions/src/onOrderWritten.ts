import { Article, Order, OrderItem, OrderItemGiftCard, PaidOrder, PromotionCode } from '@couture-next/types';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { getMailer } from './mailer';
import { routes } from '@couture-next/routing';
import env from './env';
import { getStorage } from 'firebase-admin/storage';
import { FieldPath, getFirestore } from 'firebase-admin/firestore';
import { adminFirestoreConverterAddRemoveId, adminFirestoreOrderConverter } from '@couture-next/utils';
import { deleteImageWithSizeVariants, getPublicUrl } from './utils';
import { generateInvoice } from './billing/invoice';
import { createReadStream } from 'fs';
import { defineSecret } from 'firebase-functions/params';
import { getClient } from './brevoEvents';
import { trpc } from './trpc';

const crmSecret = defineSecret('CRM_SECRET');

// Careful, do not update or delete order, this would create an infinite loop
export const onOrderWritten = onDocumentWritten(
  {
    document: 'orders/{docId}',
    secrets: [crmSecret],
  },
  async (event) => {
    const snapshotBefore = event.data?.before;
    const prevData = snapshotBefore?.data() as Omit<Order, '_id'> | undefined;
    const snapshotAfter = event.data?.after;
    const nextData = snapshotAfter?.data() as Omit<Order, '_id'> | undefined;

    if (!prevData && snapshotAfter?.id.startsWith('legacy')) {
      // newly imported order, do not go further
      console.log('Newly imported order, do not go further');
      return;
    }

    // No longer a draft, waiting for bank transfer or paid by card
    if (
      (prevData?.status === undefined && nextData?.status === 'waitingBankTransfer') ||
      (prevData?.status === 'draft' && nextData?.status === 'paid') ||
      (prevData?.status === undefined && nextData?.status === 'paid')
    ) {
      const firestore = getFirestore();

      // Update gift cards
      // DEPRECATED, WILL BE HANDLED AFTER REFACTORING OR ORDERS
      // await Promise.all(
      //   Object.entries(nextData.billing.giftCards).map(async ([giftCardId, amount]) => {
      //     const giftCardRef = firestore.collection('giftCards').doc(giftCardId) as DocumentReference<
      //       GiftCard,
      //       GiftCard
      //     >;
      //     await giftCardRef.update({ consumedAmount: FieldValue.increment(amount) }).catch((e) => {
      //       console.error('Error while updating gift card', giftCardId, e);
      //     });
      //   })
      // );

      // handle promotion code
      if (nextData.promotionCode) {
        await incrementPromotionCodeCounter(nextData.promotionCode.code);
      }

      // Update article stocks
      const articlesSnapshot =
        nextData.items.filter((item) => item.type !== 'giftCard').length > 0
          ? await firestore
              .collection('articles')
              .withConverter(adminFirestoreConverterAddRemoveId<Article>())
              .where(
                FieldPath.documentId(),
                'in',
                nextData.items.map((item) => item.articleId).filter((id): id is string => id !== undefined)
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

      // Notify admin
      const mailer = getMailer();
      await mailer.scheduleSendEmail('admin-new-order', env.ADMIN_EMAIL, {
        ORDER_HREF: new URL(
          routes().admin().orders().order(snapshotAfter!.id).show(),
          env.FRONTEND_BASE_URL
        ).toString(),
      });

      // Notify CRM
      const crmClient = getClient(crmSecret.value());
      // TODO check if submitted is the right event for gift cards
      await crmClient.sendEvent('orderSubmitted', nextData.user.email, {}).catch((e) => {
        console.error('Error while sending event orderSubmitted to CRM', e);
      });
    }

    // Order paid, (any method)
    if (prevData?.status !== 'paid' && nextData?.status === 'paid') {
      // Notify CRM
      const crmClient = getClient(crmSecret.value());
      await crmClient.sendEvent('orderPaid', nextData.user.email, {}).catch((e) => {
        console.error('Error while sending event orderPaid to CRM', e);
      });

      // If order contains a gift card, create gift cards
      const giftCardItems = nextData.items.filter((item): item is OrderItemGiftCard => item.type === 'giftCard');
      if (giftCardItems.length > 0) {
        await Promise.all(
          giftCardItems.map(async (item) => {
            const createGiftCardPaydload = {
              amount: item.details.amount,
              image: item.image,
              email: item.details.recipient.email,
            } as const;
            const docRef = await trpc.tmp.createGiftCard.mutate(createGiftCardPaydload);
            console.log('Created gift card', docRef.id);
          })
        );
      }

      // Generate invoice
      const order = adminFirestoreOrderConverter.fromFirestore(snapshotAfter! as any);
      const invoiceLocalPath = await generateInvoice(order as PaidOrder);
      const storage = getStorage();
      const invoiceFileRef = storage.bucket().file(`orders/${snapshotAfter?.id}/invoice.pdf`);
      await invoiceFileRef.save(createReadStream(invoiceLocalPath));
      await snapshotAfter?.ref.set(
        { invoice: { uid: invoiceFileRef.name, url: getPublicUrl(invoiceFileRef.name) } },
        { merge: true }
      );
    }

    // Tracking number updated
    if (prevData?.shipping.trackingNumber === undefined && nextData?.shipping.trackingNumber !== undefined) {
      const mailer = getMailer();
      await mailer.scheduleSendEmail(
        'order-sent',
        {
          email: nextData.user.email,
          firstname: nextData.user.firstName,
          lastname: nextData.user.lastName,
        },
        { ORDER_TRACKING_NUMBER: nextData.shipping.trackingNumber }
      );
      if (nextData?.workflowStep !== 'in-delivery' && nextData?.workflowStep !== 'delivered')
        await snapshotAfter?.ref.set({ workflowStep: 'in-delivery' } satisfies Partial<Order>, { merge: true });
    }

    // ORDER DELIVERED
    if (prevData?.workflowStep !== 'delivered' && nextData?.workflowStep === 'delivered') {
      const reviewUrl = new URL(
        routes().account().orders().order(snapshotAfter!.id).review(),
        env.FRONTEND_BASE_URL
      ).toString();

      // Notify CRM
      const crmClient = getClient(crmSecret.value());
      await crmClient
        .sendEvent('orderDelivered', nextData.user.email, {
          REVIEW_HREF: reviewUrl,
        })
        .catch((e) => {
          console.error('Error while sending event orderDelivered to CRM', e);
        });
    }

    // STATUS UPDATED, SEND EMAILS
    if (prevData?.status === 'waitingBankTransfer' && nextData?.status === 'paid' && snapshotAfter) {
      // Order payment validated
      const mailer = getMailer();
      const orderHref = new URL(
        routes().account().orders().order(snapshotAfter.id).show(),
        env.FRONTEND_BASE_URL
      ).toString();
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
      const mailer = getMailer();
      const orderHref = new URL(
        routes().account().orders().order(snapshotAfter.id).show(),
        env.FRONTEND_BASE_URL
      ).toString();
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
      const mailer = getMailer();
      await mailer.scheduleSendEmail(
        'bank-transfer-instructions',
        {
          email: nextData.user.email,
          firstname: nextData.user.firstName,
          lastname: nextData.user.lastName,
        },
        {
          ORDER_TOTAL: nextData.totalTaxIncluded.toFixed(2),
        }
      );
    }

    // STATUS UPDATED, MOVE IMAGES
    if (
      ((prevData?.status === 'draft' && nextData?.status === 'paid') ||
        (prevData?.status === undefined && nextData?.status === 'waitingBankTransfer') ||
        (prevData?.status === undefined && nextData?.status === 'paid')) &&
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
  }
);

function incrementPromotionCodeCounter(code: string) {
  // TODO when migrating orders

  // const firestore = getFirestore();
  // const promotionCodeSnapshot = await firestore
  //   .collection('promotionCodes')
  //   .withConverter(adminFirestoreConverterAddRemoveId<PromotionCode>())
  //   .where('code', '==', code)
  //   .get();
  // if (promotionCodeSnapshot.empty) return console.warn('Promotion code not found');

  // const snapshot = promotionCodeSnapshot.docs[0];
  // snapshot.ref.set({ used: snapshot.data().used + 1 }, { merge: true });
  return Promise.resolve();
}
