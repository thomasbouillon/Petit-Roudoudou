import { bool, envsafe, port, str, url } from 'envsafe';

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
});
