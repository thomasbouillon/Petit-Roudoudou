import { router } from '../../trpc';
import findById from './findById';
import search from './search';

export default router({ search, findById });
