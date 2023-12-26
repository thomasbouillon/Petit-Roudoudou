import { defineSecret } from 'firebase-functions/params';
import { onMessagePublished } from 'firebase-functions/v2/pubsub';
import { ZodType, z } from 'zod';
import { Templates, getMailer } from './mailer';

const mailjetClientKey = defineSecret('MAILJET_CLIENT_KEY');
const mailjetClientSecret = defineSecret('MAILJET_CLIENT_SECRET');

const eventSchema = z.object({
  templateKey: z.literal('bank-transfer-instructions'),
  emailTo: z.string().email(),
  variables: z.object({
    USER_FIRSTNAME: z.string(),
    USER_LASTNAME: z.string(),
    ORDER_TOTAL: z.string(),
  }) satisfies ZodType<Templates['bank-transfer-instructions']['variables']>,
});

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
