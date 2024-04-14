import { router } from '../../trpc';
import getValue from './getValue';
import setValue from './setValue';

export default router({
  getValue,
  setValue,
});
