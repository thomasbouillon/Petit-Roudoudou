import { router } from '../../trpc';
import create from './create';
import list from './list';
import searchByName from './searchByName';
import del from './delete';

export default router({
  list,
  create,
  delete: del,
  searchByName,
});
