import { envsafe, url } from 'envsafe';

export default envsafe({
  CORS_FRONTEND_URL: url({
    devDefault: 'http://localhost:4200',
  }),
});
