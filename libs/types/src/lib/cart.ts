export type Cart = {
  userId: string;
  items: CartItem[];
  articleIds: string[];
  totalTaxExcluded: number;
  totalTaxIncluded: number;
  totalWeight: number;
  taxes: Record<string, number>;
  paymentId?: string;
  draftOrderId?: string;
};

export type CartMetadata = {
  updatedAt: number;
};

export type CartItemBase = {
  description: string;
  image: {
    url: string;
    uid: string;
    placeholderDataUrl?: string;
  };
  totalTaxExcluded: number;
  totalTaxIncluded: number;
  perUnitTaxExcluded: number;
  perUnitTaxIncluded: number;
  totalWeight: number;
  quantity: number;
  taxes: Record<string, number>;
};

export type ArticleRelatedCartItem = CartItemBase & {
  articleId: string;
  skuId: string;
  customizations: CartItemCustomizations;
};

export type CartItemCustomizations = Record<
  string,
  { title: string; value: string | boolean; type: 'fabric' | 'text' | 'boolean' }
>;

export type CartItemCustomized = ArticleRelatedCartItem & {
  type: 'customized';
  stockUid?: never;
};

export type CartItemInStock = ArticleRelatedCartItem & {
  type: 'inStock';
  stockUid: string;
};

export type CartItemGiftCard = CartItemBase & {
  type: 'giftCard';
  amount: number;
  recipient: { name: string; email: string };
  text: string;

  customizations?: Record<string, never>;
  skuId?: never;
  stockUid?: never;
  articleId?: never;
};

export type CartItem = CartItemInStock | CartItemCustomized | CartItemGiftCard;

export type NewCustomizedCartItem = {
  articleId: string;
  skuId: string;
  customizations: Record<string, unknown>;
  imageDataUrl: string;
};

export type NewInStockCartItem = {
  articleId: string;
  stockUid: string;
  customizations: Record<string, unknown>;
  imageDataUrl?: string;
};

export type NewGiftCardCartItem = {
  amount: number;
  recipient: { name: string; email: string };
  text: string;
  imageDataUrl: string;
};
