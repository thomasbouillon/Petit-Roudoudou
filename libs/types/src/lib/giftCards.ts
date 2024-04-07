export type GiftCard = {
  _id: string;
  amount: number;
  consumedAmount: number;
  createdAt: Date;
  image: {
    url: string;
    uid: string;
    placeholderDataUrl?: string;
  };
} & (
  | {
      status: 'claimed';
      userId: string;
    }
  | {
      status: 'unclaimed';
      userEmail: string;
    }
);
