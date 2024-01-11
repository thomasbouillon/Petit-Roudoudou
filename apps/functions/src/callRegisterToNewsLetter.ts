import { CallSubscribeToNewsletterPayload, CallSubscribeToNewsletterResponse } from '@couture-next/types';
import { defineSecret } from 'firebase-functions/params';
import { onCall } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { getMailer } from './mailer';
import env from './env';

const mailjetClientKey = defineSecret('MAILJET_CLIENT_KEY');
const mailjetClientSecret = defineSecret('MAILJET_CLIENT_SECRET');

export const callRegisterToNewsLetter = onCall<unknown, Promise<CallSubscribeToNewsletterResponse>>(
  { cors: '*', secrets: [mailjetClientKey, mailjetClientSecret] },
  async (event) => {
    const payload = subscribeSchema.parse(event.data) satisfies CallSubscribeToNewsletterPayload;
    const mailer = getMailer(mailjetClientKey.value(), mailjetClientSecret.value());

    await mailer.addToContactList(payload.name, payload.email, env.MAILJET_NEWSLETTER_LIST_ID, {
      Catégorie: payload.category,
      Prénom: payload.name,
    });
    await mailer.scheduleSendEmail('newsletter-welcome', payload.email, {});
  }
);

const subscribeSchema = z.object({
  name: z.string().min(1, "Le prénom n'est pas valide."),
  email: z.string().email("L'email n'est pas valide."),
  category: z.enum(['future-parent', 'parent', 'for-me']),
  privacy: z.literal(true, { errorMap: () => ({ message: 'Vous devez accepter les conditions.' }) }),
});
