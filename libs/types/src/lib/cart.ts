export type Cart = {
  userId: string;
  items: CartItem[];
  totalTaxExcluded: number;
  totalTaxIncluded: number;
  taxes: Record<string, number>;
  paymentId?: string;
  draftOrderId?: string;
};

export type CartItemBase = {
  articleId: string;
  description: string;
  skuId: string;
  image: {
    url: string;
    uid: string;
    placeholderDataUrl?: string;
  };
  totalTaxExcluded: number;
  totalTaxIncluded: number;
  taxes: Record<string, number>;
};

export type CartItemCustomized = CartItemBase & {
  type: 'customized';
  customizations: Record<string, unknown>;
};

export type CartItemInStock = CartItemBase & {
  type: 'inStock';
  customizations?: never;
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
};
