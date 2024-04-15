import { router } from '../trpc';
import create from './create';
import findByArticle from './findByArticle';

export default router({
  create,
  findByArticle,
});
