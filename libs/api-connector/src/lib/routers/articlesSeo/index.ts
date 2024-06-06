import { router } from '../../trpc';

import findById from './findById';
import findBySlug from './findBySlug';

import update from './update';

export default router({
  update,
  findById,
  findBySlug,

});
