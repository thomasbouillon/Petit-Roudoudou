import { Order } from '@couture-next/types';
import { adminFirestoreOrderConverter } from '@couture-next/utils';
import { getFirestore } from 'firebase-admin/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getMailer } from './mailer';
import { routes } from '@couture-next/routing';
import * as logger from 'firebase-functions/logger';
import env from './env';

export const scheduledSendAskReviewEmail = onSchedule(
  {
    schedule: '30 11 * * *',
    timeZone: 'Europe/Paris',
  },
  async () => {
    console.log('TRIGGERING');
    const firestore = getFirestore();

    const ordersQuery = firestore
      .collection('orders')
      .where('workflowStep', '==', 'delivered' satisfies Order['workflowStep'])
      .where('reviewEmailSentAt', '==', null)
      .withConverter(adminFirestoreOrderConverter);

    const mailer = getMailer();

    const orders = await ordersQuery.get().then((snap) => snap.docs.map((doc) => doc.data()));

    const promises = orders.map(async (order) => {
      try {
        await mailer.scheduleSendEmail(
          'order-ask-review',
          {
            email: order.user.email,
            lastname: order.user.lastName,
            firstname: order.user.firstName,
          },
          {
            REVIEW_HREF: new URL(
              routes().account().orders().order(order._id).review(),
              env.FRONTEND_BASE_URL
            ).toString(),
          }
        );
        await firestore.collection('orders').doc(order._id).set({ reviewEmailSentAt: new Date() }, { merge: true });
      } catch (error) {
        console.error('An error occured');
        logger.error(error);
      }
    });

    await Promise.all(promises);
  }
);
