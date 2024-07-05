import { router } from '../../trpc';
import create from './create';
import findById from './findById';
import list from './list';
import update from './update';

export default router({
  create,
  findById,
  update,
  list,
});
