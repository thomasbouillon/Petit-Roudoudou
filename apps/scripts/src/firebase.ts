import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getFirestore as originalGetFirebase } from 'firebase-admin/firestore';

export function getFirestore() {
  //   if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  //     throw new Error('GOOGLE_APPLICATION_CREDENTIALS environment variable is not set');
  //   }
  if (!process.env.FIRESTORE_EMULATOR_HOST) {
    throw new Error('FIRESTORE_EMULATOR_HOST environment variable is not set');
  }

  const app = initializeApp({
    credential: applicationDefault(),
    projectId: 'petit-roudoudou-daae4',
  });

  return originalGetFirebase(app);
}
