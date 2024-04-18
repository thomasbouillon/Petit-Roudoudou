import { router } from '../../trpc';
import addToMyCart from './addToMyCart';
import changeQuantityInMyCart from './changeQuantityInMyCart';
import findMyCart from './findMyCart';

export default router({
  findMyCart,
  addToMyCart,
  changeQuantityInMyCart,
});
