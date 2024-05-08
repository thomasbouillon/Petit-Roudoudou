import { router } from '../../trpc';
import averageOrderPrice from './averageOrderPrice';
import monthlySales from './monthlySales';

export default router({
  averageOrderPrice,
  monthlySales,
});
