import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getAuth as originalGetAuth } from 'firebase-admin/auth';
import { getFirestore as originalGetFirebase } from 'firebase-admin/firestore';

export function getFirestore() {
  if (!process.env.FIRESTORE_EMULATOR_HOST) {
    throw new Error('FIRESTORE_EMULATOR_HOST environment variable is not set');
  }

  return originalGetFirebase(getApp());
}

export function getAuth() {
  if (!process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    throw new Error('FIREBASE_AUTH_EMULATOR_HOST environment variable is not set');
  }

  return originalGetAuth(getApp());
}

let app: any;
function getApp() {
  if (!app) {
    app = initializeApp({
      credential: applicationDefault(),
      projectId: 'petit-roudoudou-daae4',
    });
  }

  return app;
}
