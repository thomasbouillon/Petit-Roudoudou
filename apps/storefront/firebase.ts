import { initializeApp } from 'firebase/app';
import { getPerformance } from 'firebase/performance';

const app = initializeApp({
  apiKey: 'AIzaSyBxLoDAvG2PemfKHaTU1lAXnFfy7WpolBQ',
  authDomain: 'petit-roudoudou-daae4.firebaseapp.com',
  projectId: 'petit-roudoudou-daae4',
  storageBucket: 'petit-roudoudou-daae4.appspot.com',
  messagingSenderId: '1067614578029',
  appId: '1:1067614578029:web:09b2fd4273c2311f7de664',
});

export default app;

if (typeof window !== 'undefined') {
  getPerformance(app);
}
