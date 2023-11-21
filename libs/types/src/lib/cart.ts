export type Cart = {
  userId: string;
  items: CartItem[];
  totalTaxExcluded: number;
  totalTaxIncluded: number;
  taxes: Record<string, number>;
  paymentId?: string;
  draftOrderId?: string;
};

export type CartItem = {
  articleId: string;
  description: string;
  skuId: string;
  customizations: Record<string, unknown>;
  image: {
    url: string;
    uid: string;
    placeholderDataUrl?: string;
  };
  totalTaxExcluded: number;
  totalTaxIncluded: number;
  taxes: Record<string, number>;
};

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
