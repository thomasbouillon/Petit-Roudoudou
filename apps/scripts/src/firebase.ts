import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getAuth as originalGetAuth } from 'firebase-admin/auth';
import { getFirestore as originalGetFirebase } from 'firebase-admin/firestore';
import { getStorage as originalGetStorage } from 'firebase-admin/storage';

export function getFirestore() {
  if (!process.env.FIRESTORE_EMULATOR_HOST) {
    throw new Error('FIRESTORE_EMULATOR_HOST environment variable is not set');
  }

  return originalGetFirebase(getApp());
}

export function getStorage() {
  if (!process.env.FIREBASE_STORAGE_EMULATOR_HOST) {
    throw new Error('FIREBASE_STORAGE_EMULATOR_HOST environment variable is not set');
  }

  return originalGetStorage(getApp());
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
      storageBucket: 'petit-roudoudou-daae4.appspot.com',
      credential: applicationDefault(),
      projectId: 'petit-roudoudou-daae4',
    });
  }

  return app;
}
