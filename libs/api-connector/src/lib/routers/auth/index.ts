import { router } from '../../trpc';
import login from './login';
import register from './register';
import me from './me';
import googleOauth from './google-oauth';

export default router({
  me,
  login,
  register,
  googleOauth,
});
