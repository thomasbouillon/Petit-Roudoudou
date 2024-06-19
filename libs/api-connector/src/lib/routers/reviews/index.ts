import { router } from '../../trpc';
import create from './create';
import find from './find';
import findByArticle from './findByArticle';

export default router({
  create,
  find,
  findByArticle,
});
