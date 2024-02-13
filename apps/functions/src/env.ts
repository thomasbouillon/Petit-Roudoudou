import { bool, email, envsafe, num, url } from 'envsafe';

export default envsafe({
  FRONTEND_BASE_URL: url({ devDefault: 'http://localhost:4200' }),
  STORAGE_BASE_URL: url({
    devDefault: 'http://127.0.0.1:9199/v0/b/petit-roudoudou-daae4.appspot.com/o',
  }),
  CDN_BASE_URL: url({
    devDefault: 'http://127.0.0.1:9199/v0/b/petit-roudoudou-daae4.appspot.com/o',
  }),
  CMS_BASE_URL: url({
    devDefault: 'http://localhost:3000',
  }),
  BOXTAL_API_URL: url({ default: 'https://test.com' }),
  MAILER_FROM: email({ devDefault: 'test@test.com' }),
  MAILER_SANDBOX: bool({ devDefault: true }),
  MAILER_TEMPLATE_SEND_BANK_TRANSFER_INSTRUCTIONS: num({ devDefault: 0 }),
  MAILER_TEMPLATE_BANK_TRANSFER_RECEIVED: num({ devDefault: 0 }),
  MAILER_TEMPLATE_CARD_PAYMENT_RECEIVED: num({ devDefault: 0 }),
  MAILER_TEMPLATE_ADMIN_NEW_ORDER: num({ devDefault: 0 }),
  MAILER_TEMPLATE_CONTACT: num({ devDefault: 0 }),
  MAILER_TEMPLATE_ORDER_ASK_REVIEW: num({ devDefault: 0 }),

  MAILER_NEWSLETTER_LIST_ID: num({ devDefault: 0 }),

  SHOULD_CHECK_EMAIL_PUBSUB_TOPIC: bool({ devDefault: true, default: false }),
  ADMIN_EMAIL: email({ devDefault: 'admin@test.com' }),
});
