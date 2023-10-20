export type Cart = {
  userId: string;
  items: CartItem[];
  totalTaxExcluded: number;
  totalTaxIncluded: number;
  taxes: Record<string, number>;
};

export type CartItem = {
  articleId: string;
  skuId: string;
  customizations: Record<string, unknown>;
};
