import { CallSubscribeToNewsletterResponse } from '@couture-next/types';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { defineSecret } from 'firebase-functions/params';
import { onCall } from 'firebase-functions/v2/https';

const brevoClientKey = defineSecret('BREVO_CLIENT_KEY');

export const callRegisterAdminWebNotifications = onCall<unknown, Promise<CallSubscribeToNewsletterResponse>>(
  { cors: '*', secrets: [brevoClientKey] },
  async (event) => {
    if (!event.auth?.token.admin) {
      throw new Error('unauthorized');
    }

    const token = (event.data as any).token;
    const firestore = getFirestore();

    const docRef = firestore.collection('webPushTokens').doc();
    await docRef.set({
      token,
      userId: event.auth?.uid,
      createdAt: new Date(),
    });
  }
);
