import { router } from '../../trpc';
import findManyById from './findManyById';
import findOwned from './findOwned';

export default router({
  findManyById,
  findOwned,
});
