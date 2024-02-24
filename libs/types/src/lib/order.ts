import { PromotionCode } from './promotionCode';

type Base<PaymentMethod extends 'bank-transfert' | 'card'> = {
  _id: string;
  createdAt: Date;
  user: {
    uid: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  paidAt?: never;
  workflowStep?: never;
  items: OrderItem[];
  extras: ExtrasWithPrices;
  totalTaxExcluded: number;
  totalTaxIncluded: number;
  subTotalTaxExcluded: number;
  subTotalTaxIncluded: number;
  totalWeight: number;
  taxes: Record<string, number>;
  billing: {
    civility: 'M' | 'Mme';
    firstName: string;
    lastName: string;
    address: string;
    addressComplement: string;
    city: string;
    zipCode: string;
    country: string;
  } & (PaymentMethod extends 'card' ? { checkoutSessionId: string } : { checkoutSessionId?: never });
  shipping:
    | {
        method: 'pickup-at-workshop';
        civility?: never;
        firstName?: never;
        lastName?: never;
        address?: never;
        addressComplement?: never;
        city?: never;
        zipCode?: never;
        country?: never;
        price: {
          taxExcluded: 0;
          taxIncluded: 0;
          originalTaxExcluded: 0;
          originalTaxIncluded: 0;
        };
        trackingNumber?: never;
      }
    | ({
        civility: 'M' | 'Mme';
        firstName: string;
        lastName: string;
        address: string;
        addressComplement: string;
        city: string;
        zipCode: string;
        country: string;
        price: {
          taxExcluded: number;
          taxIncluded: number;
          originalTaxExcluded: number;
          originalTaxIncluded: number;
        };
      } & (({ method: 'colissimo' } | { method: 'mondial-relay'; relayPoint: { code: string } }) & {
        trackingNumber?: string;
      }));
  manufacturingTimes?: {
    min: number;
    max: number;
    unit: 'days' | 'weeks' | 'months';
  };
  promotionCode?: Omit<PromotionCode, '_id'>;
  reviewEmailSentAt?: never;
};

export type DraftOrder = {
  status: 'draft';
  billing: {
    checkoutSessionUrl: string;
  };
} & Base<'card'>;

export type WaitingBankTransferOrder = {
  status: 'waitingBankTransfer';
} & Base<'bank-transfert'>;

export type NewDraftOrder = Omit<DraftOrder, '_id' | 'createdAt'> & {
  _id?: never;
  createdAt?: never;
};

export type NewWaitingBankTransferOrder = Omit<WaitingBankTransferOrder, '_id' | 'createdAt'> & {
  _id?: never;
  createdAt?: never;
};

export type PaidOrder<PaymentMethod extends 'bank-transfert' | 'card' = any> = {
  status: 'paid';
  workflowStep: 'in-production' | 'in-delivery' | 'delivered';
  paidAt: Date;
  paymentMethod: PaymentMethod;
  reviewEmailSentAt?: Date;
} & Omit<Base<PaymentMethod>, 'paidAt' | 'workflowStep' | 'reviewEmailSentAt'>;

export type Order = DraftOrder | PaidOrder | WaitingBankTransferOrder;

export type UrgentOrder = Order & {
  extras: {
    reduceManufacturingTimes: NonNullable<Order['extras']['reduceManufacturingTimes']>;
  };
};

export type OrderItemBase = {
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
  originalTotalTaxExcluded: number;
  originalTotalTaxIncluded: number;
  originalPerUnitTaxExcluded: number;
  originalPerUnitTaxIncluded: number;
  weight: number;
  taxes: Record<string, number>;
  quantity: number;
  articleId?: string;
  reviewId?: string;
};

export type OrderItemCustomized = OrderItemBase & {
  type: 'customized';
  originalStockId?: never;
  customizations: { title: string; value: string; type: 'fabric' | 'text' | 'boolean' }[];
};

export type OrderItemInStock = OrderItemBase & {
  type: 'inStock';
  originalStockId: string;
  customizations: { title: string; value: string; type: 'text' | 'boolean' }[];
};

export type OrderItem = OrderItemCustomized | OrderItemInStock;

export type Extras = {
  reduceManufacturingTimes: boolean;
};

export type ExtrasWithPrices = {
  [K in keyof Extras]?: {
    price: {
      priceTaxExcluded: number;
      priceTaxIncluded: number;
    };
  };
};
