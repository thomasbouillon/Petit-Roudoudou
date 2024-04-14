import { envsafe, port, str, url } from 'envsafe';

export default envsafe({
  PORT: port({ default: 3000 }),
  HOST: str({ devDefault: 'localhost', default: '0.0.0.0' }),
  NODE_ENV: str({ devDefault: 'development', default: 'production', choices: ['development', 'production'] }),
  CORS_ORIGIN: str({ devDefault: '*' }),
  CDN_BASE_URL: url(),
  DATABASE_URL: url(),

  // Firebase
  FIRESTORE_EMULATOR_HOST: str({ devDefault: '127.0.0.1:8080', allowEmpty: true }),
  FIREBASE_STORAGE_EMULATOR_HOST: str({ devDefault: '127.0.0.1:9199', allowEmpty: true }),
  FIREBASE_AUTH_EMULATOR_HOST: str({ devDefault: '127.0.0.1:9099', allowEmpty: true }),
});

// GOOGLE_APPLICATION_CREDENTIALS=$HOME/.config/gcloud/application_default_credentials.json FIREBASE_STORAGE_EMULATOR_HOST=127.0.0.1:9199 FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 FIRESTORE_EMULATOR_HOST=127.0.0.1:8080  node ./dist/apps/scripts/apps/scripts/src/main.js seed-orders --pathToCsv ./apps/scripts/var/orders.csv
