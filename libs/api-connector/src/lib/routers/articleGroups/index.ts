import { router } from '../../trpc';
import searchByName from './searchByName';
import list from './list';
import create from './create';
import del from './delete';
import findBySlug from './findBySlug';
import findById from './findById';

export default router({
  create,
  delete: del,
  searchByName,
  list,
  findBySlug,
  findById,
});
