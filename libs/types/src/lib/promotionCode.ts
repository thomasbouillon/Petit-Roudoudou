type BaseFilters = {
  category?: 'inStock' | 'customized';
  articleId?: string;
};

type BaseConditions = {
  minAmount?: number;
  until?: Date;
  usageLimit?: number;
};

type PromotionCodeBase = {
  _id: string;
  code: string;
  discount: number;
  conditions: BaseConditions;
  used: number;
};

type FiltrablePromotionCode = PromotionCodeBase & {
  type: 'percentage' | 'fixed';
  filters: BaseFilters;
};

type GlobalPromotionCode = PromotionCodeBase & {
  type: 'freeShipping';
  filters?: never;
};

export type PromotionCode = FiltrablePromotionCode | GlobalPromotionCode;

export type NewPromotionCode = Omit<PromotionCode, '_id' | 'used'>;
