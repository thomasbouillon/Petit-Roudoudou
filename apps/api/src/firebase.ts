import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getAuth as originalGetAuth } from 'firebase-admin/auth';
import { getFirestore as originalGetFirebase } from 'firebase-admin/firestore';
import { getStorage as originalGetStorage } from 'firebase-admin/storage';
import env from './env';

export function getFirestore() {
  if (env.NODE_ENV === 'development' && !env.FIRESTORE_EMULATOR_HOST) {
    throw new Error('FIRESTORE_EMULATOR_HOST environment variable is not set');
  } else if (env.NODE_ENV === 'development') {
    process.env.FIRESTORE_EMULATOR_HOST = env.FIRESTORE_EMULATOR_HOST;
  }

  return originalGetFirebase(getApp());
}

export function getStorage() {
  if (env.NODE_ENV === 'development' && !env.FIREBASE_STORAGE_EMULATOR_HOST) {
    throw new Error('FIREBASE_STORAGE_EMULATOR_HOST environment variable is not set');
  } else if (env.NODE_ENV === 'development') {
    process.env.FIREBASE_STORAGE_EMULATOR_HOST = env.FIREBASE_STORAGE_EMULATOR_HOST;
    // process.env.GOOGLE_APPLICATION_CREDENTIALS = '/home/miette/.config/gcloud/application_default_credentials.json';
    // console.log('process.env.GOOGLE_APPLICATION_CREDENTIALS', process.env.GOOGLE_APPLICATION_CREDENTIALS);
  }

  return originalGetStorage(getApp());
}

export function getAuth() {
  if (env.NODE_ENV === 'development' && !env.FIREBASE_AUTH_EMULATOR_HOST) {
    throw new Error('FIREBASE_AUTH_EMULATOR_HOST environment variable is not set');
  } else if (env.NODE_ENV === 'development') {
    process.env.FIREBASE_AUTH_EMULATOR_HOST = env.FIREBASE_AUTH_EMULATOR_HOST;
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
