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
  paymentMethod?: never;
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
        trackingNumber?: string;
        price: {
          taxExcluded: 0;
          taxIncluded: 0;
          originalTaxExcluded: 0;
          originalTaxIncluded: 0;
        };
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
        trackingNumber?: string;
        price: {
          taxExcluded: number;
          taxIncluded: number;
          originalTaxExcluded: number;
          originalTaxIncluded: number;
        };
      } & ({ method: 'colissimo' } | { method: 'mondial-relay'; relayPoint: { code: string } }));
  manufacturingTimes?: {
    min: number;
    max: number;
    unit: 'days' | 'weeks' | 'months';
  };
  promotionCode?: Omit<PromotionCode, '_id' | 'used'>;
  adminComment?: never;
};

export type DraftOrder = {
  status: 'draft';
  billing: {
    checkoutSessionUrl: string;
  };
} & Base<'card'>;

export type WaitingBankTransferOrder = {
  status: 'waitingBankTransfer';
  adminComment: string;
} & Omit<Base<'bank-transfert'>, 'adminComment'>;

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
  adminComment: string;
} & Omit<Base<PaymentMethod>, 'paidAt' | 'paymentMethod' | 'workflowStep' | 'adminComment'>;

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
  originalTotalTaxExcluded: number;
  originalTotalTaxIncluded: number;
  weight: number;
  taxes: Record<string, number>;

  customerComment?: string;
  totalWeight?: number;
  quantity?: number;
};

export type OrderItemCustomized = OrderItemBase & {
  type: 'customized';
  customizations: { title: string; value: string; type: 'fabric' | 'text' | 'boolean' }[];
};

export type OrderItemInStock = OrderItemBase & {
  type: 'inStock';
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
