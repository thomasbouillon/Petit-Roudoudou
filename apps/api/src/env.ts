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
