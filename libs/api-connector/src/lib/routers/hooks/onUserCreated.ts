import { PrismaClient, User } from '@prisma/client';

type Transaction = Pick<PrismaClient, 'giftCard'>;

export default async (transaction: Transaction, user: User) => {
  // Claim gift cards
  const giftCards = await transaction.giftCard.updateMany({
    where: {
      userEmail: user.email,
      status: 'UNCLAIMED',
    },
    data: {
      status: 'CLAIMED',
      userId: user.id,
      userEmail: null,
    },
  });

  if (giftCards.count) {
    console.debug(`Claimed ${giftCards.count} gift card(s) for user ${user.email}`);
  }
};
