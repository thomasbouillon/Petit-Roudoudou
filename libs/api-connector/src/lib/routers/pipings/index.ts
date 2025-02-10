import { router } from '../../trpc';
import create from './create';
import findById from './findById';
import list from './list';
import update from './update';
import del from './delete';

export default router({
  findById,
  create,
  delete: del,
  update,
  list,
});
