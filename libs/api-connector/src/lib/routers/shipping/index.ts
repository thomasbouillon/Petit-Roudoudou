import { router } from '../../trpc';
import getAvailableOffersForMyCart from './getAvailableOffersForMyCart';
import listPickupPointsForCarrier from './listPickupPointsForCarrier';

export default router({
  getAvailableOffersForMyCart,
  listPickupPointsForCarrier,
});
