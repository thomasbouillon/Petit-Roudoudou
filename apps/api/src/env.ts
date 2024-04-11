import { envsafe, port, str } from 'envsafe';

export default envsafe({
  PORT: port({ default: 3000 }),
  HOST: str({ devDefault: 'localhost', default: '0.0.0.0' }),
  NODE_ENV: str({ devDefault: 'development', default: 'production', choices: ['development', 'production'] }),
  CORS_ORIGIN: str({ devDefault: '*' }),
});
