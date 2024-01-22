import { CallSubscribeToNewsletterPayload, CallSubscribeToNewsletterResponse } from '@couture-next/types';
import { defineSecret } from 'firebase-functions/params';
import { onCall } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { getMailer } from './mailer';
import env from './env';

const brevoClientKey = defineSecret('BREVO_CLIENT_KEY');

export const callRegisterToNewsLetter = onCall<unknown, Promise<CallSubscribeToNewsletterResponse>>(
  { cors: '*', secrets: [brevoClientKey] },
  async (event) => {
    const payload = subscribeSchema.parse(event.data) satisfies CallSubscribeToNewsletterPayload;
    const mailer = getMailer(brevoClientKey.value());

    await mailer.addToContactList(
      {
        email: payload.email,
        firstname: payload.name,
        lastname: '',
      },
      env.MAILER_NEWSLETTER_LIST_ID,
      {
        CATEGORIE: payload.category,
      }
    );
  }
);

const subscribeSchema = z.object({
  name: z.string().min(1, "Le prénom n'est pas valide."),
  email: z.string().email("L'email n'est pas valide."),
  category: z.enum(['future-parent', 'parent', 'for-me']),
  privacy: z.literal(true, { errorMap: () => ({ message: 'Vous devez accepter les conditions.' }) }),
});
