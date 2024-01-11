import * as mailjet from 'node-mailjet';
import { PubSub } from '@google-cloud/pubsub';
import env from './env';
import { SendEmailMessageType } from './onSendEmailMessagePublished';

export type Templates = {
  'bank-transfer-instructions': { variables: { USER_FIRSTNAME: string; USER_LASTNAME: string; ORDER_TOTAL: string } };
  'bank-transfer-received': { variables: { USER_FIRSTNAME: string; ORDER_HREF: string } };
  'card-payment-received': { variables: { USER_FIRSTNAME: string; ORDER_HREF: string } };
  'admin-new-order': { variables: { ORDER_HREF: string } };
  'newsletter-welcome': { variables: {} };
  contact: {
    variables: {
      SUBJECT: string;
      MESSAGE: string;
      EMAIL: string;
    };
  };
};

const tempalteIds = {
  'bank-transfer-instructions': env.MAILER_TEMPLATE_SEND_BANK_TRANSFER_INSTRUCTIONS,
  'bank-transfer-received': env.MAILER_TEMPLATE_BANK_TRANSFER_RECEIVED,
  'card-payment-received': env.MAILER_TEMPLATE_CARD_PAYMENT_RECEIVED,
  'admin-new-order': env.MAILER_TEMPLATE_ADMIN_NEW_ORDER,
  'newsletter-welcome': env.MAILER_TEMPLATE_NEWSLETTER_WELCOME,
  contact: env.MAILER_TEMPLATE_CONTACT,
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
  variables: (SendEmailMessageType & { templateKey: T })['variables']
) {
  await new PubSub().topic('send-email').publishMessage({
    json: {
      templateKey,
      emailTo,
      variables,
    } as SendEmailMessageType,
  });
}

type SendEmailFnType = <T extends keyof Templates = keyof Templates>(
  templateKey: T,
  emailTo: string,
  variables: Templates[T]['variables']
) => Promise<void>;

type AddToContactListFnType = (
  name: string,
  email: string,
  listId: number,
  customData?: Record<string, string>
) => Promise<void>;

export function getMailer(): { scheduleSendEmail: typeof scheduleSendEmail };
export function getMailer(
  clientKey: string,
  clientSecret: string
): {
  scheduleSendEmail: typeof scheduleSendEmail;
  sendEmail: SendEmailFnType;
  addToContactList: AddToContactListFnType;
};
export function getMailer(clientKey?: string, clientSecret?: string) {
  let client: mailjet.Client;
  if (clientKey && clientSecret) client = mailjet.Client.apiConnect(clientKey, clientSecret);

  return {
    addToContactList: async (name: string, email: string, listId: number, customData?: Record<string, string>) => {
      const contact = await client
        .get('contact')
        .id(email)
        .request()
        .catch(() => null);
      if (!contact) {
        await client
          .post('contact')
          .request(
            {
              Email: email,
              Name: name,
              IsExcludedFromCampaigns: 'false',
            },
            { version: 'v3' }
          )
          .catch((err) => {
            console.error('Error while adding contact to mailjet', err);
            throw err;
          });
      }
      if (Object.keys(customData ?? {}).length > 0)
        await client
          .put('contactdata')
          .id(email)
          .request(
            { Data: Object.entries(customData ?? {}).map(([Name, Value]) => ({ Name, Value })) },
            { version: 'v3' }
          );

      await client.post('listrecipient').request(
        {
          IsUnsubscribed: 'false',
          ContactAlt: email,
          ListID: listId,
        },
        { version: 'v3' }
      );
    },
    scheduleSendEmail,
    sendEmail: (async (templateKey, emailTo, variables) => {
      if (env.MAILER_SANDBOX)
        console.info('Sending email to', emailTo, 'with template', templateKey, 'and variables', variables);
      else console.debug('Sending email (templateKey=' + templateKey + ')');
      await client.post('send').request(
        {
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
        },
        {
          version: 'v3.1',
        }
      );
    }) satisfies SendEmailFnType,
  };
}
