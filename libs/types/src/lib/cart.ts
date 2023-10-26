export type Cart = {
  userId: string;
  items: CartItem[];
  totalTaxExcluded: number;
  totalTaxIncluded: number;
  taxes: Record<string, number>;
};

export type CartItem = {
  articleId: string;
  description: string;
  skuId: string;
  customizations: Record<string, unknown>;
  image: string;
  totalTaxExcluded: number;
  totalTaxIncluded: number;
  taxes: Record<string, number>;
};

export type NewCartItem = {
  articleId: string;
  skuId: string;
  customizations: Record<string, unknown>;
  imageDataUrl: string;
};
