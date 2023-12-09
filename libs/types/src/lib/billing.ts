export type BillingOrderItem = {
  price: number;
  quantity: number;
  quantity_unit: string;
  label: string;
  image?: string;
};

export type BillingClient = {
  createProviderSession: (
    ref: string,
    email: string,
    items: BillingOrderItem[],
    successUrl: string
  ) => Promise<{ sessionId: string; paymentId: string; public_id: string }>;
  cancelProviderSession: (id: string) => Promise<void>;
  isProviderSessionExpired: (id: string) => Promise<boolean>;
};
