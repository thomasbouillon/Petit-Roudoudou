import { bool, email, envsafe, num, port, str, url } from 'envsafe';

export default envsafe({
  PORT: port({ default: 3000 }),
  HOST: str({ devDefault: 'localhost', default: '0.0.0.0' }),
  NODE_ENV: str({ devDefault: 'development', default: 'production', choices: ['development', 'production'] }),
  CORS_ORIGIN: str({ devDefault: 'http://localhost:4200' }),
  CDN_BASE_URL: url(),
  STORAGE_BASE_URL: url(),
  FRONTEND_BASE_URL: url({ devDefault: 'http://localhost:4200' }),
  DATABASE_URL: url(),

  ENABLE_VAT_PASS_THROUGH: bool({ default: true }),

  JWT_SECRET: str({ devDefault: 'jwt-secret' }),
  COOKIE_DOMAIN: str({ devDefault: 'localhost' }),

  // Firebase
  FIRESTORE_EMULATOR_HOST: str({ devDefault: '127.0.0.1:8080', allowEmpty: true }),
  FIREBASE_STORAGE_EMULATOR_HOST: str({ devDefault: '127.0.0.1:9199', allowEmpty: true }),
  FIREBASE_AUTH_EMULATOR_HOST: str({ devDefault: '127.0.0.1:9099', allowEmpty: true }),

  // CRM
  CRM_CLIENT_SECRET: str(),
  CRM_SANDBOX: bool({ devDefault: true, default: false }),

  // Google OAuth
  GOOGLE_OAUTH_CLIENT_ID: str(),
  GOOGLE_OAUTH_CLIENT_SECRET: str(),
  GOOGLE_OAUTH_REDIRECT_URI: url(),

  // Stripe
  STRIPE_SECRET_KEY: str(),
  STRIPE_WEBHOOK_SECRET: str(),

  // Boxtal
  BOXTAL_API_URL: url(),
  BOXTAL_USER: str(),
  BOXTAL_SECRET: str(),

  // CMS
  CMS_BASE_URL: url(),

  // ISR
  ISR_SECRET: str(),
  ISR_URL: url(),

  // Mailer
  ADMIN_EMAIL: email(),
  MAILER_CLIENT_KEY: str(),
  MAILER_SANDBOX: bool({ devDefault: true, default: false }),

  MAILER_TEMPLATE_SEND_BANK_TRANSFER_INSTRUCTIONS: num({ devDefault: 0 }),
  MAILER_TEMPLATE_BANK_TRANSFER_RECEIVED: num({ devDefault: 0 }),
  MAILER_TEMPLATE_CARD_PAYMENT_RECEIVED: num({ devDefault: 0 }),
  MAILER_TEMPLATE_ADMIN_NEW_ORDER: num({ devDefault: 0 }),
  MAILER_TEMPLATE_CONTACT: num({ devDefault: 0 }),
  MAILER_TEMPLATE_ORDER_ASK_REVIEW: num({ devDefault: 0 }),
  MAILER_TEMPLATE_ORDER_SENT: num({ devDefault: 0 }),
  MAILER_TEMPLATE_AUTH_RESET_PASSWORD: num({ devDefault: 0 }),
  MAILER_TEMPLATE_NEW_GIFTCARD: num({ devDefault: 0 }),

  MAILER_NEWSLETTER_LIST_ID: num({ devDefault: 0 }),

  // Recaptcha
  RECAPTCHA_SECRET: str(),
});
