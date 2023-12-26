import * as mailjet from 'node-mailjet';
import { PubSub } from '@google-cloud/pubsub';
import env from './env';
import { SendEmailMessageType } from './onSendEmailMessagePublished';

export type Templates = {
  'bank-transfer-instructions': { variables: { USER_FIRSTNAME: string; USER_LASTNAME: string; ORDER_TOTAL: string } };
};

const tempalteIds = {
  'bank-transfer-instructions': env.MAILER_TEMPLATE_SEND_BANK_TRANSFER_INSTRUCTIONS,
} satisfies {
  [key in keyof Templates]: number;
};

if (env.SHOULD_CHECK_EMAIL_PUBSUB_TOPIC) {
  // DEV ONLY, create topic if not exists
  const topic = new PubSub().topic('send-email');
  topic.exists().then((rs) => {
    console.log('Topic exists?', rs[0]);
    if (!rs[0]) topic.create();
  });
}

async function scheduleSendEmail<T extends keyof Templates = keyof Templates>(
  templateKey: T,
  emailTo: string,
  variables: Templates[T]['variables']
) {
  await new PubSub().topic('send-email').publishMessage({
    json: {
      templateKey,
      emailTo,
      variables,
    } satisfies SendEmailMessageType,
  });
}

type SendEmailFnType = <T extends keyof Templates = keyof Templates>(
  templateKey: T,
  emailTo: string,
  variables: Templates[T]['variables']
) => Promise<void>;

export function getMailer(): { scheduleSendEmail: typeof scheduleSendEmail };
export function getMailer(
  clientKey: string,
  clientSecret: string
): { scheduleSendEmail: typeof scheduleSendEmail; sendEmail: SendEmailFnType };
export function getMailer(clientKey?: string, clientSecret?: string) {
  let client: mailjet.Client;
  if (clientKey && clientSecret)
    client = mailjet.Client.apiConnect(clientKey, clientSecret, {
      config: { host: 'api.mailjet.com', version: 'v3.1' },
    });

  return {
    scheduleSendEmail,
    sendEmail: (async (templateKey, emailTo, variables) => {
      if (env.MAILER_SANDBOX)
        console.info('Sending email to', emailTo, 'with template', templateKey, 'and variables', variables);

      await client.post('send', { version: 'v3.1' }).request({
        SandboxMode: env.MAILER_SANDBOX,
        Messages: [
          {
            From: {
              Email: env.MAILER_FROM,
              Name: 'Petit Roudoudou',
            },
            To: [
              {
                Email: emailTo,
              },
            ],
            TemplateID: tempalteIds[templateKey],
            TemplateLanguage: true,
            Variables: variables,
          },
        ],
      });
    }) satisfies SendEmailFnType,
  };
}
