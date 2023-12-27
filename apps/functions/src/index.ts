import { initializeApp } from 'firebase-admin/app';
import { setGlobalOptions } from 'firebase-functions/v2/options';

initializeApp();

setGlobalOptions({
  maxInstances: 2,
  region: 'europe-west3',
});

export { grantAdminRole } from './grantAdminRole';
export { onFabricWritten } from './onFabricWritten';
export { onArticleWritten } from './onArticleWritten';
export { onOrderUpdated } from './onOrderUpdated';
export { onOrderDeleted } from './onOrderDeleted';
export { callEditCart } from './callEditCart';
export { callGetCartPaymentUrl } from './billing/callGetPaymentUrl';
export { callPayByBankTransfer } from './billing/callPayByBankTransfer';
export { webhookStripe } from './billing/webhookStripe';
export { callListPickupPoints, callGetShippingPrices } from './shipping';
export { onSendEmailMessagePublished } from './onSendEmailMessagePublished';
