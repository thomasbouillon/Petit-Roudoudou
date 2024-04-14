import { router } from '../../trpc';
import login from './login';
import register from './register';
import me from './me';

export default router({
  me,
  login,
  register,
});
