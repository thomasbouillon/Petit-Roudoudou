import { router } from '../../trpc';
import findById from './findById';
import search from './search';
import update from './update';

export default router({ search, findById, update });
