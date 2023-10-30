import { envsafe, url } from 'envsafe';

export default envsafe({
  FRONTEND_BASE_URL: url({ devDefault: 'http://localhost:4200' }),
});
