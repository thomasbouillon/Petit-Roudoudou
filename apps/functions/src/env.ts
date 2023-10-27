import { envsafe, str } from 'envsafe';

export default envsafe({
  CORS_FRONTEND_URL: str({
    devDefault: 'localhost:4200',
  }),
});
