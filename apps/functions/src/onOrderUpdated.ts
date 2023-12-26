import { Order } from '@couture-next/types';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { getMailer } from './mailer';
import { defineSecret } from 'firebase-functions/params';
import { routes } from '@couture-next/routing';
import env from './env';

const mailjetClientKey = defineSecret('MAILJET_CLIENT_KEY');
const mailjetClientSecret = defineSecret('MAILJET_CLIENT_SECRET');

// Careful, do not update or delete order, this would create an infinite loop
export const onOrderUpdated = onDocumentUpdated('orders/{docId}', async (event) => {
  const snapshotBefore = event.data?.before;
  const prevData = snapshotBefore?.data() as Omit<Order, '_id'> | undefined;
  const snapshotAfter = event.data?.after;
  const nextData = snapshotAfter?.data() as Omit<Order, '_id'> | undefined;

  if (prevData?.status === 'waitingBankTransfer' && nextData?.status === 'paid' && snapshotAfter) {
    // Order payment validated
    const mailer = getMailer(mailjetClientKey.value(), mailjetClientSecret.value());
    const orderHref = new URL(routes().account().orders().order(snapshotAfter.id), env.FRONTEND_BASE_URL).toString();
    mailer.scheduleSendEmail('bank-transfer-received', nextData.user.email, {
      USER_FIRSTNAME: nextData.user.firstName,
      ORDER_HREF: orderHref,
    });
  } else if (prevData?.status === 'draft' && nextData?.status === 'paid' && snapshotAfter) {
    // Order paid by card
    const mailer = getMailer(mailjetClientKey.value(), mailjetClientSecret.value());
    const orderHref = new URL(routes().account().orders().order(snapshotAfter.id), env.FRONTEND_BASE_URL).toString();
    mailer.scheduleSendEmail('card-payment-received', nextData.user.email, {
      USER_FIRSTNAME: nextData.user.firstName,
      ORDER_HREF: orderHref,
    });
    mailer.scheduleSendEmail('admin-new-order', env.ADMIN_EMAIL, { ORDER_HREF: orderHref });
  }
});
