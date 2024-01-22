'use client';

import 'apps/storefront/firebase';
import { getMessaging, getToken, onMessage } from '@firebase/messaging';
import useFunctions from 'apps/storefront/hooks/useFunctions';
import { httpsCallable } from 'firebase/functions';
import { useEffect, useMemo } from 'react';

export default function AdminNotifications() {
  const messaging = useMemo(() => getMessaging(), []);
  const functions = useFunctions();

  const registerToWebPush = useMemo(() => httpsCallable(functions, 'callRegisterAdminWebNotifications'), []);

  useEffect(() => {
    const hasWebPushSaved = localStorage.getItem('hasWebPushSaved');
    if (hasWebPushSaved === 'true') return;

    Notification.requestPermission().then(async (permission) => {
      if (permission === 'granted') {
        const token = await getToken(messaging, { vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY });
        console.log('token', token);

        await registerToWebPush({ token });
        localStorage.setItem('hasWebPushSaved', 'true');
      }
    });

    const unsub = onMessage(messaging, (payload) => {
      console.log('Message received. ', payload);
      // ...
    });

    return () => unsub();
  }, []);

  return null;
}
