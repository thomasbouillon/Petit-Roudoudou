import { envsafe, url } from 'envsafe';

export default envsafe({
  FRONTEND_BASE_URL: url({ devDefault: 'http://localhost:4200' }),
  STORAGE_BASE_URL: url({
    devDefault:
      'http://127.0.0.1:9199/v0/b/petit-roudoudou-daae4.appspot.com/o',
  }),
});
