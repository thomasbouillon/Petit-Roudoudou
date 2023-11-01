import { initializeApp } from 'firebase-admin/app';
import { setGlobalOptions } from 'firebase-functions/v2/options';

initializeApp();

setGlobalOptions({
  maxInstances: 2,
  region: 'europe-west9',
});

export { grantAdminRole } from './grantAdminRole';
export { onFabricWritten } from './onFabricWritten';
export { onArticleWritten } from './onArticleWritten';
export { callEditCart } from './callEditCart';
export { callGetCartPaymentUrl } from './billing/callGetPaymentUrl';
export { webhookStripe } from './billing/webhookStripe';
