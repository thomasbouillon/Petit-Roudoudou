import { defineSecret } from 'firebase-functions/params';
import { onMessagePublished } from 'firebase-functions/v2/pubsub';
import { ZodType, z } from 'zod';
import { Templates, getMailer } from './mailer';

const brevoClientKey = defineSecret('BREVO_CLIENT_KEY');

const eventSchema = z.union([
  z.object({
    templateKey: z.literal('bank-transfer-instructions'),
    emailTo: z.object({
      firstname: z.string(),
      lastname: z.string(),
      email: z.string().email(),
    }) satisfies ZodType<Templates['bank-transfer-instructions']['to']>,
    variables: z.object({
      ORDER_TOTAL: z.string(),
    }) satisfies ZodType<Templates['bank-transfer-instructions']['variables']>,
  }),
  z.object({
    templateKey: z.literal('bank-transfer-received'),
    emailTo: z.object({
      firstname: z.string(),
      lastname: z.string(),
      email: z.string().email(),
    }) satisfies ZodType<Templates['bank-transfer-received']['to']>,
    variables: z.object({
      ORDER_HREF: z.string(),
    }) satisfies ZodType<Templates['bank-transfer-received']['variables']>,
  }),
  z.object({
    templateKey: z.literal('card-payment-received'),
    emailTo: z.object({
      firstname: z.string(),
      lastname: z.string(),
      email: z.string().email(),
    }) satisfies ZodType<Templates['card-payment-received']['to']>,
    variables: z.object({
      ORDER_HREF: z.string(),
    }) satisfies ZodType<Templates['card-payment-received']['variables']>,
  }),
  z.object({
    templateKey: z.literal('admin-new-order'),
    emailTo: z.string().email() satisfies ZodType<
      Templates['admin-new-order']['to'] extends undefined ? string : never
    >,

    variables: z.object({
      ORDER_HREF: z.string(),
    }) satisfies ZodType<Templates['admin-new-order']['variables']>,
  }),
  z.object({
    templateKey: z.literal('contact'),
    emailTo: z.string().email() satisfies ZodType<Templates['contact']['to'] extends undefined ? string : never>,
    variables: z.object({
      SUBJECT: z.string(),
      MESSAGE: z.string(),
      EMAIL: z.string().email(),
    }) satisfies ZodType<Templates['contact']['variables']>,
  }),
  z.object({
    templateKey: z.literal('order-ask-review'),
    emailTo: z.object({
      firstname: z.string(),
      lastname: z.string(),
      email: z.string().email(),
    }) satisfies ZodType<Templates['order-ask-review']['to']>,
    variables: z.object({
      REVIEW_HREF: z.string(),
    }) satisfies ZodType<Templates['order-ask-review']['variables']>,
  }),
  z.object({
    templateKey: z.literal('order-sent'),
    variables: z.object({
      ORDER_TRACKING_NUMBER: z.string(),
    }) satisfies ZodType<Templates['order-sent']['variables']>,
    emailTo: z.object({
      firstname: z.string(),
      lastname: z.string(),
      email: z.string().email(),
    }) satisfies ZodType<Templates['order-sent']['to']>,
  }),
]);

export type SendEmailMessageType = z.infer<typeof eventSchema>;

export const onSendEmailMessagePublished = onMessagePublished(
  {
    topic: 'send-email',
    secrets: [brevoClientKey],
    retry: true,
  },
  async (event) => {
    const { templateKey, emailTo, variables } = eventSchema.parse(event.data.message.json);

    const mailer = getMailer(brevoClientKey.value());
    await mailer.sendEmail(templateKey, emailTo as any, variables);
  }
);
