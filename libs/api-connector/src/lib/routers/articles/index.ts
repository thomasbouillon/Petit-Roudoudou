import { router } from '../../trpc';
import create from './create';
import findById from './findById';
import findBySlug from './findBySlug';
import findStocksByArticleId from './findStocksByArticleId';
import list from './list';
import syncShippingDetails from './syncShippingDetails';
import update from './update';
import updateSeo from './updateSeo';

export default router({
  create,
  update,
  updateSeo,
  list,
  findById,
  findBySlug,
  findStocksByArticleId,
  syncShippingDetails,
});
