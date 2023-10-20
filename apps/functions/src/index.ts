import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { setGlobalOptions } from 'firebase-functions/v2/options';

initializeApp({
  credential: applicationDefault(),
});

setGlobalOptions({
  maxInstances: 2,
  region: 'europe-west9',
});

export { grantAdminRole } from './grantAdminRole';
export { onFabricWritten } from './onFabricWritten';
export { callEditCart } from './callEditCart';
