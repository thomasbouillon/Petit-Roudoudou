/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onRequest } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2/options';
import type { Article } from '@couture-next/types';
setGlobalOptions({
  maxInstances: 2,
  region: 'europe-west9',
});

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

export const helloWorld = onRequest((request, response) => {
  const a: Article = {
    name: '',
    description: '',
    characteristics: {},
    seo: {
      title: '',
      description: '',
    },
    images: [],
  };
  response.send('Hello from Firebase!');
  console.log(a);
});
