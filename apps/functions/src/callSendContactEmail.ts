import { CallSendContactEmailResponse } from '@couture-next/types';
import { onCall } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { getMailer } from './mailer';
import { defineSecret } from 'firebase-functions/params';
import env from './env';

const recaptchaSecret = defineSecret('RECAPTCHA_SECRET');

export const callSendContactEmail = onCall<unknown, CallSendContactEmailResponse>(
  {
    cors: '*',
    secrets: [recaptchaSecret],
  },
  async (event) => {
    const payload = await z
      .object({
        email: z.string().email(),
        subject: z.string(),
        message: z.string(),
        recaptchaToken: z.string().refine(async (token) => await validateRecaptcha(token)),
      })
      .parseAsync(event.data);

    const mailer = getMailer();
    mailer.scheduleSendEmail('contact', env.ADMIN_EMAIL, {
      EMAIL: payload.email,
      SUBJECT: payload.subject,
      MESSAGE: payload.message,
    });
  }
);

async function validateRecaptcha(token: string) {
  try {
    const response = await fetch(
      `https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaSecret.value()}&response=${token}`,
      {
        method: 'POST',
      }
    );
    const data = await response.json();
    return data.success as boolean;
  } catch (error) {
    return false;
  }
}
