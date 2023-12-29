import { defineSecret } from 'firebase-functions/params';
import { onMessagePublished } from 'firebase-functions/v2/pubsub';
import { ZodType, z } from 'zod';
import { Templates, getMailer } from './mailer';

const mailjetClientKey = defineSecret('MAILJET_CLIENT_KEY');
const mailjetClientSecret = defineSecret('MAILJET_CLIENT_SECRET');

const eventSchema = z.union([
  z.object({
    templateKey: z.literal('bank-transfer-instructions'),
    emailTo: z.string().email(),
    variables: z.object({
      USER_FIRSTNAME: z.string(),
      USER_LASTNAME: z.string(),
      ORDER_TOTAL: z.string(),
    }) satisfies ZodType<Templates['bank-transfer-instructions']['variables']>,
  }),
  z.object({
    templateKey: z.literal('bank-transfer-received'),
    emailTo: z.string().email(),
    variables: z.object({
      USER_FIRSTNAME: z.string(),
      ORDER_HREF: z.string(),
    }) satisfies ZodType<Templates['bank-transfer-received']['variables']>,
  }),
  z.object({
    templateKey: z.literal('card-payment-received'),
    emailTo: z.string().email(),
    variables: z.object({
      USER_FIRSTNAME: z.string(),
      ORDER_HREF: z.string(),
    }) satisfies ZodType<Templates['card-payment-received']['variables']>,
  }),
  z.object({
    templateKey: z.literal('admin-new-order'),
    emailTo: z.string().email(),
    variables: z.object({
      ORDER_HREF: z.string(),
    }) satisfies ZodType<Templates['admin-new-order']['variables']>,
  }),
  z.object({
    templateKey: z.literal('contact'),
    emailTo: z.string().email(),
    variables: z.object({
      SUBJECT: z.string(),
      MESSAGE: z.string(),
      EMAIL: z.string().email(),
    }) satisfies ZodType<Templates['contact']['variables']>,
  }),
]);

export type SendEmailMessageType = z.infer<typeof eventSchema>;

export const onSendEmailMessagePublished = onMessagePublished(
  {
    topic: 'send-email',
    secrets: [mailjetClientKey, mailjetClientSecret],
  },
  async (event) => {
    const { templateKey, emailTo, variables } = eventSchema.parse(event.data.message.json);

    const mailer = getMailer(mailjetClientKey.value(), mailjetClientSecret.value());
    await mailer.sendEmail(templateKey, emailTo, variables);
  }
);
