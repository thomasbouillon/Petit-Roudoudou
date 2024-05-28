import { router } from '../../trpc';
import create from './create';
import findById from './findById';
import findBySlug from './findBySlug';
import list from './list';
import syncShippingDetails from './syncShippingDetails';
import update from './update';

export default router({
  create,
  update,
  list,
  findById,
  findBySlug,
  syncShippingDetails,
});
