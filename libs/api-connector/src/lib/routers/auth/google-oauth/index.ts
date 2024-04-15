import { router } from '../../../trpc';
import getAuthorizationUrl from './getAuthorizationUrl';
import login from './login';

export default router({
  getAuthorizationUrl,
  login,
});
