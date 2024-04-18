export type OrderItemCustomized = PrismaJson.OrderItem & {
  type: 'customized';
};

export type OrderItemGiftCard = PrismaJson.OrderItem & {
  type: 'giftCard';
};

export type OrderItemInStock = PrismaJson.OrderItem & {
  type: 'inStock';
};
