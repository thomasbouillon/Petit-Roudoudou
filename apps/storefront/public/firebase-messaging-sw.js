import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';

console.log('Hello from service worker!');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
const firebaseApp = initializeApp({
  apiKey: 'AIzaSyBxLoDAvG2PemfKHaTU1lAXnFfy7WpolBQ',
  authDomain: 'petit-roudoudou-daae4.firebaseapp.com',
  projectId: 'petit-roudoudou-daae4',
  storageBucket: 'petit-roudoudou-daae4.appspot.com',
  messagingSenderId: '1067614578029',
  appId: '1:1067614578029:web:09b2fd4273c2311f7de664',
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = getMessaging(firebaseApp);

// TODO handle notification click

onBackgroundMessage(messaging, (payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = 'Background Message Title';
  const notificationOptions = {
    body: 'Background Message body.',
    icon: '/logo.png',
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
