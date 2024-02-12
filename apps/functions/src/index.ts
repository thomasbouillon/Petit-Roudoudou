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
export { onOrderWritten } from './onOrderWritten';
export { callEditCart } from './callEditCart';
export { callGetCartPaymentUrl } from './billing/callGetPaymentUrl';
export { callPayByBankTransfer } from './billing/callPayByBankTransfer';
export { webhookStripe } from './billing/webhookStripe';
export { callListPickupPoints, callGetShippingPrices } from './shipping';
export { onSendEmailMessagePublished } from './onSendEmailMessagePublished';
export { callGetPromotionCodeDiscount } from './callGetPromotionCodeDiscount';
export { callSendContactEmail } from './callSendContactEmail';
export { callAddReview } from './callAddReview';
export { callRegisterToNewsLetter } from './callRegisterToNewsLetter';
export { httpReceiveUpdateNotificationFromCMS } from './httpReceiveUpdateNotificationFromCMS';
export { onFileUploaded } from './onFileUploaded';
export { onCartWritten } from './onCartWritten';
export { callRegisterAdminWebNotifications } from './callRegisterAdminWebNotifications';
export { scheduledSendAskReviewEmail } from './scheduledSendAskReviewEmail';
export { scheduledDeleteInactiveAnonymousUsers } from './scheduledDeleteInactiveAnonymousUsers';
