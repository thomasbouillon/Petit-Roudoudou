import { router } from '../../trpc';
import login from './login';
import register from './register';
import me from './me';
import googleOauth from './google-oauth';
import sendResetPasswordEmail from './sendResetPasswordEmail';
import resetPassword from './resetPassword';

export default router({
  me,
  login,
  register,
  googleOauth,
  sendResetPasswordEmail,
  resetPassword,
});
