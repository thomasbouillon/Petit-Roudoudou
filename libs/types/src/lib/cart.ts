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
  articleId: string;
  description: string;
  skuId: string;
  customizations: Record<string, { title: string; value: string | boolean; type: 'fabric' | 'text' | 'boolean' }>;
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

export type CartItemCustomized = CartItemBase & {
  type: 'customized';
  stockUid?: never;
};

export type CartItemInStock = CartItemBase & {
  type: 'inStock';
  stockUid: string;
};

export type CartItem = CartItemInStock | CartItemCustomized;

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
