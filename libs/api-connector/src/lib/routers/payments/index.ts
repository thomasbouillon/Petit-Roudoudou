import { router } from '../../trpc';
import createPayByCardUrl from './createPayByCardUrl';
import payByBankTransfer from './payByBankTransfer';
import payByGiftCard from './payByGiftCard';
import validateBankTransferPayment from './validateBankTransferPayment';
import validateCardPayment from './validateCardPayment';

export default router({
  createPayByCardUrl,
  payByBankTransfer,
  payByGiftCard,
  validateCardPayment,
  validateBankTransferPayment,
});
