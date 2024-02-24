import * as brevo from '@getbrevo/brevo';
import { PubSub } from '@google-cloud/pubsub';
import env from './env';
import { SendEmailMessageType } from './onSendEmailMessagePublished';

export type MailerContact = {
  firstname: string;
  lastname: string;
  email: string;
};

export type Templates = {
  'bank-transfer-instructions': { to: MailerContact; variables: { ORDER_TOTAL: string } };
  'bank-transfer-received': { to: MailerContact; variables: { ORDER_HREF: string } };
  'card-payment-received': { to: MailerContact; variables: { ORDER_HREF: string } };
  'admin-new-order': { to?: never; variables: { ORDER_HREF: string } };
  'order-ask-review': { to: MailerContact; variables: { REVIEW_HREF: string } };
  'order-sent': { to: MailerContact; variables: { ORDER_TRACKING_NUMBER: string } };
  contact: {
    to?: never;
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
  'order-ask-review': env.MAILER_TEMPLATE_ORDER_ASK_REVIEW,
  'order-sent': env.MAILER_TEMPLATE_ORDER_SENT,
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
  to: Templates[T]['to'] extends never | undefined ? string : MailerContact,
  variables: (SendEmailMessageType & { templateKey: T })['variables']
) {
  await new PubSub().topic('send-email').publishMessage({
    json: {
      templateKey,
      emailTo: to,
      variables,
    } as SendEmailMessageType,
  });
}

type SendEmailFnType = <T extends keyof Templates = keyof Templates>(
  templateKey: T,
  contact: Templates[T]['to'] extends never ? string : MailerContact,
  variables: Templates[T]['variables']
) => Promise<void>;

type AddToContactListFnType = (
  contact: MailerContact,
  listId: number,
  customData?: Record<string, string>
) => Promise<void>;

type CreateOrUpdateContactFnType = (
  contact: MailerContact,
  customData?: Record<string, string>
) => Promise<{
  email: string;
  listIds: number[];
}>;

export function getMailer(): { scheduleSendEmail: typeof scheduleSendEmail };
export function getMailer(clientKey: string): {
  createOrUpdateContact: CreateOrUpdateContactFnType;
  scheduleSendEmail: typeof scheduleSendEmail;
  sendEmail: SendEmailFnType;
  addToContactList: AddToContactListFnType;
};
export function getMailer(clientKey?: string) {
  if (!clientKey) return { scheduleSendEmail };

  const createOrUpdateContact = async (contact: MailerContact, customData?: Record<string, string>) => {
    const brevoContactApi = new brevo.ContactsApi();
    brevoContactApi.setApiKey(brevo.ContactsApiApiKeys.apiKey, clientKey);

    let existingContact: brevo.GetContactDetails | undefined;
    try {
      existingContact = await brevoContactApi.getContactInfo(contact.email).then((res) => res.body);
    } catch (err) {
      console.error("Error while getting contact's info");
      if (err && (err as any).status !== 404) throw err;
    }

    const nextAttributes = { ...customData, PRENOM: contact.firstname, NOM: contact.lastname } as Record<
      string,
      string
    >;

    const someAttributeChanged =
      existingContact &&
      Object.entries(nextAttributes).some(
        ([key, value]) =>
          value !== '' &&
          existingContact &&
          (!existingContact.attributes || (existingContact.attributes as any)[key] !== value)
      );
    if (existingContact && someAttributeChanged) {
      console.info('Updating contact');
      const updateContact = new brevo.UpdateContact();
      updateContact.attributes = nextAttributes;
      await brevoContactApi.updateContact(contact.email, updateContact).catch((err) => {
        console.error('Error while updating contact');
        throw err;
      });
    } else if (!existingContact) {
      console.info('Creating contact');
      const newContact = new brevo.CreateContact();
      newContact.email = contact.email;
      newContact.attributes = nextAttributes;

      await brevoContactApi.createContact(contact).catch((err) => {
        console.error('Error while creating contact');
        throw err;
      });

      return {
        email: contact.email,
        listIds: [] as number[],
      };
    }

    return {
      email: existingContact.email,
      listIds: existingContact.listIds,
    };
  };

  return {
    createOrUpdateContact,
    addToContactList: async (contact: MailerContact, listId: number, contactCustomData?: Record<string, string>) => {
      if (env.MAILER_SANDBOX) {
        console.info('Adding contact to list', listId);
        return;
      }

      const brevoContactApi = new brevo.ContactsApi();
      brevoContactApi.setApiKey(brevo.ContactsApiApiKeys.apiKey, clientKey);

      const contactInMailer = await createOrUpdateContact(contact, contactCustomData);
      if (contactInMailer.listIds.includes(listId)) return;

      const addContactToList = new brevo.AddContactToList();
      addContactToList.emails = [contact.email];

      await brevoContactApi.addContactToList(listId, addContactToList);
    },
    scheduleSendEmail,
    sendEmail: (async (templateKey, contact, variables) => {
      if (env.MAILER_SANDBOX) {
        console.info(
          'Sending email to',
          JSON.stringify(contact, null, 2),
          'with template',
          templateKey,
          'and variables',
          variables
        );
        return;
      }

      const emailTo = typeof contact === 'string' ? contact : contact.email;
      if (typeof contact !== 'string') {
        await createOrUpdateContact(contact);
      }

      console.log('Sending email');

      const brevoEmailApi = new brevo.TransactionalEmailsApi();
      brevoEmailApi.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, clientKey);

      const emailToSend = new brevo.SendSmtpEmail();
      emailToSend.to = [{ email: emailTo }];
      emailToSend.templateId = tempalteIds[templateKey];
      emailToSend.params = variables;

      await brevoEmailApi.sendTransacEmail(emailToSend);
    }) satisfies SendEmailFnType,
  };
}
