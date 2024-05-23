import { router } from '../../trpc';
import searchByName from './searchByName';
import list from './list';
import create from './create';
import del from './delete';
import findBySlug from './findBySlug';
import findById from './findById';
import update from './update';

export default router({
  create,
  update,
  delete: del,
  searchByName,
  list,
  findBySlug,
  findById,
});
