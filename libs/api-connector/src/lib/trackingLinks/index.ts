import { router } from '../trpc';
import create from './create';
import findById from './findById';
import list from './list';
import update from './update';
import del from './delete';

export default router({
  create,
  delete: del,
  findById,
  list,
  update,
});
