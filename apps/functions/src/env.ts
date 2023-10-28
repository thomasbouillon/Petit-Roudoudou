import { envsafe, url } from 'envsafe';

export default envsafe({
  CORS_FRONTEND_ORIGIN: url({
    devDefault: 'http://localhost:4200',
    input: process.env.CORS_FRONTEND_ORIGIN,
  }),
});
