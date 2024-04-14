import { router } from '../../trpc';
import create from './create';
import findByGroups from './findByGroups';
import findById from './findById';
import findManyById from './findManyById';
import list from './list';
import update from './update';

export default router({
  create,
  update,
  list,
  findById,
  findByGroups,
  findManyById,
});
