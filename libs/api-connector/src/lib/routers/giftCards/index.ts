import { router } from '../../trpc';
import create from './create';
import list from './list';
import findManyById from './findManyById';
import findOwned from './findOwned';
import linkToMyAccount from './linkToMyAccount';

export default router({
  findManyById,
  findOwned,
  linkToMyAccount,
  list,
  create,
});
