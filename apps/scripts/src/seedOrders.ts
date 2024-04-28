import csvtojson from 'csvtojson';
import { LegacyOrder } from './legacyTypes';
import { legacyOrderSchema, shippingSchema, paymentInfoSchema } from './schemas';
import { Taxes } from '@couture-next/types';
import { Order, Prisma, PrismaClient } from '@prisma/client';

// This is one shot, sry for it...

export async function seedOrders(pathToCsv: string) {
  const ordersUnsafe = await getLegacyOrders(pathToCsv);

  const res = await legacyOrderSchema.safeParseAsync(ordersUnsafe);

  if (!res.success) {
    console.error((res as any).error);
    throw new Error('CSV parsing failed');
  }

  const orders = res.data;

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: 'mongodb://127.0.0.1:27018/roudoudou?replicaSet=rs0&serverSelectionTimeoutMS=2000&directConnection=true',
      },
    },
  });

  let counter = 0;

  console.log('Seeding orders...');
  console.log('...');
  for (const order of orders) {
    console.log(counter + '/' + orders.length + '\r');
    counter++;
    if (counter % 100 === 0) await new Promise((resolve) => setTimeout(resolve, 5000)); // avoid rate limiting
    try {
      const shippingFields = shippingSchema.parse(order);

      const discountMultiplier =
        order.promotionCode?.strategyId === 2 ||
        order.promotionCode?.strategyId === 1 ||
        order.promotionCode?.strategyId === 4
          ? 1 -
            order.promotionCode.amount /
              (order.promotionCode.strategyId === 4
                ? order.items.reduce((acc, item) => acc + (item.type === 'inStock' ? item.total : 0), 0)
                : order.base)
          : // / 1.2 do not pass through taxes
            1;

      if (discountMultiplier !== 1 && order.items.some((item) => item.type === 'giftCard')) {
        console.warn('Discount multiplier is not 1 but there is a gift card in the order');
      }

      const getItemLinePrice = (item: (typeof order.items)[number]) =>
        Math.round(
          item.total *
            ((order.promotionCode?.strategyId !== 4 || item.type === 'inStock') /* promotion code on inStockOnly */ &&
            item.type !== 'giftCard' /* no promotion code on gift cards */
              ? discountMultiplier
              : 1)
        ) / 100;

      const items = order.items.map((item) => ({
        customizations: [],
        description: item.description,

        image: item.image,
        originalTotalTaxExcluded: Math.round(item.total /* / (item.type === 'giftCard' ? 1 : 1.2) */) / 100,
        originalTotalTaxIncluded: item.total / 100,
        totalTaxIncluded: getItemLinePrice(item),
        totalTaxExcluded: getItemLinePrice(item),
        perUnitTaxExcluded: getItemLinePrice(item) / item.quantity,
        perUnitTaxIncluded: getItemLinePrice(item) / item.quantity,
        originalPerUnitTaxExcluded: Math.round(item.total) / 100 / item.quantity,
        originalPerUnitTaxIncluded: Math.round(item.total) / 100 / item.quantity,
        originalArticleId: null,
        //   Math.round(
        //     (item.total /* / (item.type === 'giftCard' ? 1 : 1.2) */) *
        //       (order.promotionCode?.strategyId !== 4 || item.type === 'inStock' ? discountMultiplier : 1)
        //   ) / 100,
        taxes: { [Taxes.VAT_20]: 0 },
        //   item.type === 'giftCard'
        // ? {}
        // : {
        //     [Taxes.VAT_20]:
        //       Math.round(
        //         (item.total / 1.2) *
        //           (order.promotionCode?.strategyId !== 4 || item.type === 'inStock'
        //             ? discountMultiplier
        //             : 1) *
        //           0.2
        //       ) / 100,
        //   }
        type: item.type as PrismaJson.OrderItem['type'],
        weight: item.totalWeight,
        quantity: item.quantity,
        customerComment: item.userComment,
        originalStockId: 'legacy',
      })) as Order['items'];

      const subTotalTaxes = items.reduce((acc, item) => acc + (item.taxes[Taxes.VAT_20] ?? 0), 0);
      const subTotalTaxExcluded = Math.round(items.reduce((acc, item) => acc + item.totalTaxExcluded, 0) * 100) / 100;
      const subTotalTaxIncluded = Math.round((subTotalTaxExcluded + subTotalTaxes) * 100) / 100;

      const taxes = {
        [Taxes.VAT_20]:
          Math.round(
            subTotalTaxes * 100 + (shippingFields.price.taxIncluded - shippingFields.price.taxExcluded) * 100 // +
            // (order.is_accelerated ? 250 : 0)
          ) / 100,
      };
      const totalTaxes = Object.values(taxes).reduce((acc, tax) => acc + tax, 0);
      const totalTaxExcluded =
        Math.round(
          (subTotalTaxExcluded + (order.is_accelerated ? 15 /* 12.5 */ : 0) + shippingFields.price.taxExcluded) * 100
        ) / 100;
      const totalTaxIncluded = Math.round((totalTaxExcluded + totalTaxes) * 100) / 100;

      if (totalTaxIncluded !== order.total / 100) {
        console.warn(
          '[WARNING] Computed total does not match previous total (id=' +
            order.legacyId +
            ', prev=' +
            order.total / 100 +
            ', computed=' +
            totalTaxIncluded +
            ')'
        );
      }

      const paymentInfos = paymentInfoSchema.parse(order);

      const toCreate = {
        id: order.id,
        reference: order.ref,
        createdAt: new Date(order.submitted_at),
        archivedAt: order.hidden ? new Date() : null,
        shipping: shippingFields,
        extras: {
          reduceManufacturingTimes: order.is_accelerated
            ? { priceTaxExcluded: 15 /* 12.5 */, priceTaxIncluded: 15 }
            : null,
        },
        items,
        adminComment: order.annotation,
        totalWeight: order.items.reduce((acc, item) => acc + item.totalWeight, 0),
        taxes,
        totalTaxExcluded,
        totalTaxIncluded,
        subTotalTaxExcluded,
        subTotalTaxIncluded,
        promotionCode:
          order.promotionCode !== null
            ? ({
                code: order.promotionCode?.code,
                used: 0,
                conditions: {
                  minAmount: null,
                  usageLimit: null,
                  validUntil: null,
                },
                filters: null,
                discount: order.promotionCode.amount,
                type:
                  order.promotionCode.strategyId === 2
                    ? 'PERCENTAGE'
                    : order.promotionCode.strategyId === 1
                    ? 'FIXED_AMOUNT'
                    : 'FREE_SHIPPING',
              } satisfies Order['promotionCode'])
            : null,

        billing: {
          address: order.user.address,
          addressComplement: order.user.addressComplement,
          civility: 'MRS',
          city: order.user.city,
          country: order.user.country,
          firstName: order.user.firstName,
          lastName: order.user.lastName,
          zipCode: '',
          giftCards: {},
          amountPaidWithGiftCards: 0,
          checkoutSessionId: order.payment_session ?? null,
          checkoutSessionUrl: null,
          paymentMethod: paymentInfos.paymentMethod,
        },
        giftOffered: false,
        invoice: null,
        manufacturingTimes: {
          min: 6,
          max: 8,
          unit: 'WEEKS',
        },
        paidAt: paymentInfos.paidAt,
        status: paymentInfos.status,
        submittedAt: new Date(order.submitted_at),
        updatedAt: new Date(order.submitted_at),
        workflowStep: paymentInfos.workflowStep,
        user: {
          connect: {
            email: order.user.email,
          },
        },
      } satisfies Prisma.OrderCreateInput;

      await prisma.order.create({
        data: toCreate,
      });
    } catch (e) {
      console.error('Error while preparing order promise');
      console.debug(JSON.stringify(order, null, 2));
      throw e;
    }
  }
  console.log('Orders seeded');
}

async function getLegacyOrders(pathToCsv): Promise<LegacyOrder[]> {
  return await csvtojson({
    delimiter: ';',
    noheader: false,
  }).fromFile(pathToCsv);
}
