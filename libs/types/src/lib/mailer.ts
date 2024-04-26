export type MailerContact = {
  firstname: string;
  lastname: string;
  email: string;
};

export type MailerTemplates = {
  'bank-transfer-instructions': { to: MailerContact; variables: { ORDER_TOTAL: string } };
  'bank-transfer-received': { to: MailerContact; variables: { ORDER_HREF: string } };
  'card-payment-received': { to: MailerContact; variables: { ORDER_HREF: string } };
  'admin-new-order': { to?: never; variables: { ORDER_HREF: string } };
  'order-ask-review': { to: MailerContact; variables: { REVIEW_HREF: string } };
  'order-sent': { to: MailerContact; variables: { ORDER_TRACKING_NUMBER: string } };
  'auth-reset-password': { to: string; variables: { RESET_PASSWORD_HREF: string } };
  contact: {
    to?: never;
    variables: {
      SUBJECT: string;
      MESSAGE: string;
      EMAIL: string;
    };
  };
};

type SendEmailFnType = <T extends keyof MailerTemplates = keyof MailerTemplates>(
  templateKey: T,
  contact: MailerTemplates[T]['to'] extends undefined | never | string ? string : MailerContact,
  variables: MailerTemplates[T]['variables']
) => Promise<void>;

type SubscribeContactToNewsLetterFn = (
  contact: MailerContact,
  category: 'future-parent' | 'parent' | 'for-me'
) => Promise<void>;

type CreateOrUpdateContactFnType = (
  contact: MailerContact,
  customData?: Record<string, string>
) => Promise<{
  email: string;
  listIds: number[];
}>;

export type MailerClient = {
  sendEmail: SendEmailFnType;
  subscribeToNewsLetter: SubscribeContactToNewsLetterFn;
  createOrUpdateContact: CreateOrUpdateContactFnType;
};
