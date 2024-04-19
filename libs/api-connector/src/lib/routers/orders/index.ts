import { router } from '../../trpc';
import findById from './findById';
import findMyOrders from './findMyOrders';
import find from './find';
import toggleArchived from './toggleArchived';
import editAdminComment from './editAdminComment';
import manuallySetTrackingNumber from './manuallySetTrackingNumber';
import markOrderAsDelivered from './markOrderAsDelivered';
import findByReference from './findByReference';

export default router({
  findMyOrders,
  findById,
  findByReference,
  find,
  toggleArchived,
  editAdminComment,
  manuallySetTrackingNumber,
  markOrderAsDelivered,
});
