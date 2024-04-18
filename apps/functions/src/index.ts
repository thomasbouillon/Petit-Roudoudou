import { initializeApp } from 'firebase-admin/app';
import { setGlobalOptions } from 'firebase-functions/v2/options';

initializeApp();

setGlobalOptions({
  maxInstances: 2,
  region: 'europe-west3',
});

export { grantAdminRole } from './grantAdminRole';
export { onOrderWritten } from './onOrderWritten';
export { callListPickupPoints, callGetShippingPrices } from './shipping';
export { onSendEmailMessagePublished } from './onSendEmailMessagePublished';
export { callSendContactEmail } from './callSendContactEmail';
export { callRegisterToNewsLetter } from './callRegisterToNewsLetter';
export { httpReceiveUpdateNotificationFromCMS } from './httpReceiveUpdateNotificationFromCMS';
export { onFileFinalized } from './onFileFinalized';
export { onFileDeleted } from './onFileDeleted';
export { callRegisterAdminWebNotifications } from './callRegisterAdminWebNotifications';
