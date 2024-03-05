import { onRequest } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { getFirestore } from 'firebase-admin/firestore';
import { defineSecret } from 'firebase-functions/params';

const eventSchema = z.object({
  event: z.enum(['items.update', 'items.create', 'items.delete']),
  collection: z.enum(['home', 'events', 'partners', 'blog']),
});

const cmsWebhookTokenSecret = defineSecret('CMS_WEBHOOK_TOKEN');

export const httpReceiveUpdateNotificationFromCMS = onRequest(
  {
    secrets: [cmsWebhookTokenSecret],
  },
  async (request, response) => {
    const bearer = request.headers.authorization;
    const token = bearer?.split(' ')[1];

    if (!token || token !== cmsWebhookTokenSecret.value()) {
      response.status(401).send('Unauthorized');
      return;
    }

    const payload = eventSchema.parse(request.body);

    const collection = payload.collection;
    const firestore = getFirestore();

    await firestore.collection(`cms-metadata`).doc(collection).set({
      updatedAt: new Date().getTime(),
    });

    response.status(204).send();
  }
);
