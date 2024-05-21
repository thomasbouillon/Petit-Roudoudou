import { GiftCard, GiftCardStatus } from '@prisma/client';

type ClaimedGiftCard = GiftCard & {
  status: 'CLAIMED';
  userId: string;
  userEmail: null;
};

export function isClaimedGiftCard(giftCard: GiftCard): giftCard is ClaimedGiftCard {
  console.debug('checking gift card', JSON.stringify(giftCard, null, 2));
  if (giftCard.status === ('CLAIMED' satisfies GiftCardStatus)) {
    if (!giftCard.userId) throw new Error('Claimed gift card must have a userId');
    if (giftCard.userEmail) throw new Error('Claimed gift card must not have a userEmail');
    return true;
  }
  return false;
}
